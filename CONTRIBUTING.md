# Contributing

Please ensure all pull requests and contributions comply with the [Developer Certificate of Origin](https://developercertificate.org/).

## Forking and Preparing the Repository

If you wish to contribute, start by forking this repository to your own GitHub account. Then, clone your fork to your local instance. Once you have that set up, create a new branch to start working from (you never want to work off your `main` branch, to keep it clean).

## Making Changes

All changes to the CLI logic go in the `bin.ts` file. When your changes are complete, use this command to compile into JavaScript:

```bash
tsc
```

Then, copy all code _below_ the comment block into the `/bin/ts-pro-gen` file.

## Bundling a Local Package

Once you've copied your changes, bundle the package into an `npm` `.tgz` file with the following command:

```bash
npm pack
```

This will generate a local copy of the `npm` package as a `.tgz` file.

## Installing and Testing the Package

To install the package and test it, create a new folder _outside_ your local instance of this project. Then, run the following command:

```bash
npm install ./path_to_file/ts-pro-gen.<version>.tgz
```

Note: `path_to_file` should be replaced with the relative path from your new folder to the file generated in the previous step. `version` should be replaced with the version number of the file generated, e.g. `0.0.0`

Once the installation is complete, test the cli with this command:

```bash
./node_modules/ts-pro-gen/bin/ts-pro-gen
```

## Submitting Your Changes

After testing that everything works correctly, commit your changes to your branch (be sure to sign your commits with the `-s` flag!) and push them to your fork. Now you can open a PR - make sure to follow the template! Our team will review PRs as time allows and provide feedback as needed. When everything is complete, the PR will be merged!
