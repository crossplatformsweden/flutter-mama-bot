# Flutter Mama 👵

A GitHub Action to ensure that your Flutter project has corresponding test files
for every Dart file in the `lib` directory.

## How it Works

Flutter Mama scans through all the Dart files in your `lib` directory and checks
if there is a corresponding test file in the `test` directory. If a Dart file is
missing a test file, Flutter Mama will:

1. Add a comment on the issue or pull request, listing all the Dart files
   missing test files.
2. Add a "Missing Tests" label to the issue or pull request.

If all Dart files have corresponding test files, the label will be removed and
the comment will be updated to indicate that all widgets have tests.

## Usage

Add the following step to your GitHub Actions workflow:

```yaml
- name: Flutter Mama 👵
  uses: crossplatformsweden/flutter-mama-bot@1.0
```

## Outputs

`missingTests`: A boolean indicating if there are any Dart files missing test
files.

`missingArray`: A JSON stringified array of objects, each representing a Dart
file missing a test file. Each object has the following properties:

- `originalPath`: The path to the Dart file.
- `testPath`: The expected path to the test file.
- `fileName`: The name of the Dart file.
- `testFileName`: The expected name of the test file.

## Example Workflow

```yaml
name: Check Flutter Test Coverage

on:
  pull_request:
    types:
      - synchronize
      - opened
    paths:
      - 'lib/**'
      - 'test/**'

jobs:
  test_coverage:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
        with:
          ref: ${{ github.event.pull_request.head.sha }}

      - name: Flutter Mama 👵
        uses: crossplatformsweden/flutter-mama-bot@1.0
```

## Support and Contributions

If you run into any issues or would like to contribute to Flutter Mama, please
[open an issue](https://github.com/crossplatformsweden/flutter-mama-bot/issues)
or submit a pull request on the
[GitHub repository](https://github.com/crossplatformsweden/flutter-mama-bot).

## License

This GitHub Action is released under the MIT License. See the
[LICENSE file](https://github.com/crossplatformsweden/flutter-mama-bot/blob/main/LICENSE)
in the GitHub repository for more details.
