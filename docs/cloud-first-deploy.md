# Cloud First Deploy (sity)

Use this runbook when you are deploying `sity` to AWS from scratch.
Complete `platform-ops/docs/cloud-first-deploy.md` first. `sity` depends on the shared production host and on the ingress, scrape and log collection managed there.

## 1. What You Are Building

When this runbook is complete, you will have:

- the `sity` web image published to ECR
- a `sity` application deployment running on the shared EC2 host
- public routing handled by the shared `platform-ops` ingress

One image ships. There is no API image, no database and no secret: the scene is generated in the browser and the server only serves files, `/health`, `/metrics` and the RUM endpoints. Nothing is read from OpenBao, so there is no app token and no SSM parameter to create.

## 2. Prerequisites

Run every command in this document from the `sity` repo root unless stated otherwise.

Required:

- `platform-ops` production is already deployed
- access to apply the `platform-ops` terraform in the target account
- GitHub access to configure repository environments

## 3. Provision The AWS Resources

`sity` declares no infrastructure of its own: the host, deploy bucket, ingress and every ECR repository are terraform in `platform-ops/infra/terraform/aws-compose`, one product at a time. Four additions there are what `sity` needs, following the shape the other products already have:

- `aws_ecr_repository.sity_web`, named `sity/prod/web`, immutable tags and scan on push, with the same lifecycle policy as its siblings
- an OIDC role `aws_iam_role.sity_github_deploy`, trusted for `repo:zigordev/sity:environment:production` only, allowed to authenticate to ECR, push and describe images in that one repository, read and write the deploy bucket, and run and read `AWS-RunShellScript` on the app instance
- the new repository's ARN added to the `EcrPull` statement in `ec2_runtime`, or the host can build nothing to pull the image with
- outputs for the repository URL and the role ARN, which are the two values step 4 asks for

Tags are immutable on purpose: the deploy workflow reuses an image that is already in ECR under the release tag rather than overwriting it, which is what makes re-running a deploy for a tag a no-op on the build side.

## 4. Configure The GitHub Environment

Create a `production` environment on the repository and set these variables. The values come from the `platform-ops` terraform outputs in step 3.

| Variable                     | Source                                                 |
| ---------------------------- | ------------------------------------------------------ |
| `AWS_REGION`                 | platform-ops                                           |
| `AWS_ECR_WEB_REPOSITORY_URI` | step 3                                                 |
| `AWS_DEPLOY_BUCKET`          | platform-ops                                           |
| `AWS_DEPLOY_INSTANCE_ID`     | platform-ops                                           |
| `DEPLOY_HEALTHCHECK_URL`     | `https://<sity-hostname>/health`, once step 5 resolves |

And one secret:

| Secret                | Source                                            |
| --------------------- | ------------------------------------------------- |
| `AWS_DEPLOY_ROLE_ARN` | platform-ops — the OIDC role the workflow assumes |

Deploys use GitHub OIDC. No long-lived AWS keys are stored.

`DEPLOY_HEALTHCHECK_URL` is optional: the post-deploy smoke job skips itself when it is unset. Set it once the hostname resolves, because it is the only check that the release running behind the ingress is the one the workflow just built.

## 5. Route The Hostname

The vhost is owned by `platform-ops`, not by this repository. Adding `sity` to the ingress takes, in that repo:

- a `{$SITY_WEB_DOMAIN}` site block in `docker/caddy/Caddyfile.ops.ingress.prod` that reverse-proxies `sity-web:8080` and answers 404 on `/metrics`
- `SITY_WEB_DOMAIN` in the ingress container's `environment` in `docker/compose.ops.prod.yml`
- `SITY_WEB_DOMAIN` in `docker/.env.ops.prod` and in the `ingress_domain_keys` list in `scripts/prod-deploy-remote.sh`

Missing the compose passthrough leaves Caddy with an empty site address, which takes down every other site on the host.

The DNS record is yours to create: an A record for the chosen hostname pointing at the production host's public address, before the first deploy, so Caddy can complete the certificate challenge.

## 6. Scrape The Metrics

`sity-web` exposes Prometheus metrics on `/metrics`, on the same port the ingress proxies. It is scraped over the shared network, so the job belongs in `platform-ops`:

```yaml
- job_name: 'sity-web'
  metrics_path: /metrics
  static_configs:
    - targets: ['sity-web:8080']
```

Logs need no wiring: the container writes JSON to stdout under the shared logging options, which is what the collector already reads.

## 7. Deploy

Deploys are triggered by publishing a GitHub release. release-please raises the release PR from Conventional Commits on `main`; merging it tags the release and publishes it, which starts `deploy.yml`.

To deploy an existing tag by hand, run the `Deploy AWS App (EC2 Compose)` workflow with `release_tag`.

The workflow builds and pushes the web image, scans it with Trivy, signs it and attaches its SBOM and provenance, uploads a bundle of the repository to S3, then runs `scripts/prod-deploy-remote.sh` on the host over SSM. That script writes `WEB_IMAGE` and `APP_RELEASE` into a copy of `docker/.env.app.prod`, logs in to ECR, brings up `docker/compose.app.prod.yml`, and waits for `/health` inside the container before reporting success.

## 8. Verify

```bash
curl -sf https://<sity-hostname>/health
```

Expect `{"status":"ok","service":"sity-web","release":"v0.4.0"}` with the released tag, which confirms the deployed image is the one you expect. The same tag is the `version` label on `service_build_info` in `/metrics` and the `release` field on every log line, so a stale container is visible in Grafana as well as in the probe.

Then in a browser:

- the scene renders and the panel's views, lane overlay and random route work
- `https://<sity-hostname>/assets/sity/asset-manifest.json` is served with a long cache header

Check the ingress route in `platform-ops` if the host does not resolve.

## 9. Rollback

Re-run the deploy workflow with the previous `release_tag`. Images are immutable per tag and the app holds no state, so a rollback is just the previous image starting again.

## 10. Troubleshooting

The deploy workflow fails at "Validate required deploy variables":

- one of the four `vars` is unset on the `production` GitHub environment

The deploy workflow fails at the SSM step:

- the instance is not registered with SSM, or the deploy role cannot call `ssm:SendCommand`
- the bundle did not reach `s3://<bucket>/releases/sity/<tag>/deploy-bundle.tar.gz`

The remote script fails pulling the image, with a repository-or-permission error:

- the host's instance role does not list the new repository in its `EcrPull` statement (step 3)

The container starts and the health wait times out:

- the image was built from a commit whose `npm run build` produced no `dist`, so the server has nothing to serve — the CI smoke job is what normally catches this
- the host is out of disk and the pull silently produced a partial image

The hostname does not resolve or serves another site:

- the DNS record is missing, or `SITY_WEB_DOMAIN` is not passed into the ingress container

The health check answers with the previous release:

- the compose service did not recreate, usually because `WEB_IMAGE` was unchanged; re-run the deploy with the current `release_tag`

The scrape target is down while the site is up:

- the Prometheus job is pointing at the wrong port; it is `8080` here, not the `3001` the Next apps use
