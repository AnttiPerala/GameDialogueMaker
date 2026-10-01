# Deployment

The user has authorized automatic deployment of application changes after relevant checks pass. Do not ask for deployment permission again for this project.

Confirmed destination: `W:\public_html\gameDialogueMaker`.

Run `tools/deploy.ps1` after application changes and before committing, while the changed files are visible to Git. Its default destination is the confirmed folder above. It deploys modified/new browser assets, keeps backups outside the public website, and verifies file hashes. Do not deploy tests, tools, Git metadata, or source-only engine templates. Do not delete unrelated destination files. If the drive is unavailable or verification fails, report deployment as incomplete.
