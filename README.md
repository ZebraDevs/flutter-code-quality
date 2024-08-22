# flutter-code-quality

This action is designed to format and test Flutter repositories on pull requests. It helps ensure that your code meets the required quality standards.

### Usage

Follow the instructions below to integrate this action into your workflow.

<!-- x-release-please-start-version -->

```yml
jobs:
  code-quality:
    runs-on: ubuntu-latest
    steps:
      # Checkout branch
      - uses: actions/checkout@v4
      # Set up Flutter within the action
      - uses: subosito/flutter-action@v2
        with:
          # See https://github.com/subosito/flutter-action
      - uses: ZebraDevs/flutter-code-quality@v1.0.9
        with:
          # Token used for authentication.
          token: ${{secrets.GITHUB_TOKEN}}
```

<!-- x-release-please-end -->

## Inputs

| Name              | Description                                                       | Required | Default |
| ----------------- | ----------------------------------------------------------------- | -------- | ------- |
| token             | Token used for pushing fixes and commenting on PRs.               | true     |         |
| run-tests         | Whether tests should be run.                                      | false    | true    |
| run-analysis      | Whether static analysis should be run.                            | false    | true    |
| run-coverage      | Whether code coverage should be run.                              | false    | true    |
| run-prev-coverage | Whether code coverage should be compared with the base branch.    | false    | true    |
| run-behind-by     | Whether action should check if HEAD branch is behind base branch. | false    | true    |
| create-comment    | Whether the action should comment the output status.              | false    | true    |
| working-directory | Working directory to run the action in                            | false    | "."     |

## Coverage

⚠️ To compare coverage against previous code, it is required that the code is checked out with `fetch-depth: 0`:

```yaml
- uses: actions/checkout@v4
    with:
      fetch-depth: 0
```

> During the action, coverage will be calculated, and lcov.info will be saved in temporary directory `.coverage`. Please refrain from using a top level directory with this path, as this could cause issues.

## Contributing

This project welcomes contributions. Please check out our [Contributing guide](CONTRIBUTING.md) to learn more on how to get started.

### License

This project is released under the [MIT License](./LICENSE).
