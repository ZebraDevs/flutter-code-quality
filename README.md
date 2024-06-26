# flutter-code-quality

This action is designed to format and test Flutter repositories on pull requests. It helps ensure that your code meets the required quality standards.

### Usage

Follow the instructions below to integrate this action into your workflow.

```yml
name: Pull Request
on:
  pull_request:

jobs:
  code-quality:
    runs-on: ubuntu-latest
    steps:
      # Checkout branch
      - uses: actions/checkout@v4
      # Set up Flutter within the action
      - uses: subosito/flutter-action@v2
      - uses: ZebraDevs/flutter-code-quality@main
        with:
          # Token used for authentication.
          token: ${{secrets.GITHUB_TOKEN}}
```

## Contributing

This project welcomes contributions. Pleae check out our [Contributing guide](CONTRIBUTING.md) to learn more on how to get started.

### License

This project is released under the [MIT License](./LICENSE).
