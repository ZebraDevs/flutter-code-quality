# flutter-code-quality

An action that runs on PRs to format and test Flutter repos.

### Usage

```yml
name: Pull Request

on:
  pull_request:

jobs:
  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          repository: ${{github.event.pull_request.head.repo.full_name}}
          ref: ${{ github.head_ref }}
      - uses: subosito/flutter-action@v2
        with:
          cache: true
      - uses: ZebraDevs/flutter-code-quality@main
        with:
          token: ${{secrets.GITHUB_TOKEN}}
```
