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
      - uses: ZebraDevs/flutter-code-quality@v1.0.5
        with:
          # Token used for authentication.
          token: ${{secrets.GITHUB_TOKEN}}
```

<!-- x-release-please-end -->

## Inputs

| Name               | Description                                                                | Required | Default    |
| ------------------ | -------------------------------------------------------------------------- | -------- | ---------- |
| token              | Token used for pushing fixes and commenting on PRs.                        | true     |            |
| run-tests          | Whether tests should be run.                                               | false    | true       |
| run-analysis       | Whether static analysis should be run.                                     | false    | true       |
| run-coverage       | Whether code coverage should be run.                                       | false    | true       |
| run-behind-by      | Whether action should check if HEAD branch is behind base branch.          | false    | true       |
| create-comment     | Whether the action should comment the output status.                       | false    | true       |
| working-directory  | Working directory to run the action in                                     | false    | "."        |
| coverage-directory | Directory for test coverage reports to be saved. See [coverage](#coverage) | false    | "coverage" |

//TODO: Remove coverage-directory and use some temp folder

## Coverage

//TODO: Fix this by deleting the file
By default, running the test coverage will create a directory containing an `lcov.info` file. This defaults to `coverage/lcov.info`, but can be changed using the input `coverage-directory`. It is recommended that this directory is added to `.gitignore` to ensure the file is not committed by the action, potentially causing conflicts.

> ⚠️ To compare coverage against previous code, it is required that the code is checked out with `fetch-depth: 0`:
>
> ```yaml
> - uses: actions/checkout@v4
>     with:
>       fetch-depth: 0
> ```

## Contributing

This project welcomes contributions. Please check out our [Contributing guide](CONTRIBUTING.md) to learn more on how to get started.

### License

This project is released under the [MIT License](./LICENSE).
