Derrick-CLI
===========

Derrick CLI is the global CLI application for interacting with Derrick Server.

### Installation

```shell
npm install -g derrick-cli
```

### Usage

For full documentation, see the Derrick Server documentation.

After installing Derrick Server, you'll be able to work with projects using Derrick CLI.

#### System Requirements

Since both the CLI and Derrick Server have specific system requirements, the CLI tool has a simple utility for testing and verifying your machine meets these requirements:

```bash
derrick requirements
```

#### Import

```bash
derrick import <manifest.json>
```

Imports a project defined in the manifest file. Manifests maybe local or remote.

If running this against a local repository, you can automatically add a (similarly) local Satis cache for Composer repositories by affixing a `--satis` flag.

```bash
derrick import <manifest.json> --satis http://host.dev:4680
```

#### Create

```bash
derrick create
```

Interactively create a new project

#### Export

```bash
derrick export [path]
```

Export the current state of a project. If your current working directory is not the project you wish to export, you must specify the path to the project.

### Release History

 * 2015-04-28   v0.2.1   Fix an issue with tar.gz and switch to an overlayFS for project mounting
 * 2015-04-27   v0.2.0   Enable status checking, both globally and on a project basis
 * 2015-04-26   v0.1.3   Revert a broken dependency and correct a fatal typo
 * 2015-04-25   v0.1.2   Add MU-plugins. Mount the entire /src and /vendor dirs
 * 2015-04-14   v0.1.1   Add download progress and update create/export commands
 * 2015-04-14   v0.1.0   Initial release

## Copyright / License

Derrick CLI is copyright (c) 2015 by [10up](http://10up.com) and its various contributors under the terms of the MIT license.