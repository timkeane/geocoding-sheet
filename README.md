# geocoding-sheet

An addon for Google Sheets that provides the ability to geocode location data

## Setup and tests

### Prerequisites

* Bash shell
* [Node](https://nodejs.org/en/)
* [Yarn](https://yarnpkg.com/en/)

### Install

`yarn install`

### Test

`yarn test`

## Manage GCP artifacts

### Prerequisites

* [clasp](https://developers.google.com/apps-script/guides/clasp)
* ??? google stuff
* Note: `.clasp.json` is listed in `.gitignore` and should never be pushed to any repo

### Build GCP artifacts

`yarn build`

### Push GCP artifacts

`yarn clasp-push`

### Build, version and deploy GCP artifacts

`yarn clasp-deploy`