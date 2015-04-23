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

#### Import

```bash
derrick import <manifest.json>
```

Imports a project defined in the manifest file. Manifests maybe local or remote

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

 * 2015-04-14   v0.1.1   Add progress indicators (for downloads) and update create/export commands
 * 2015-04-14   v0.1.0   Initial release

## Copyright / License

Derrick CLI is copyright (c) 2015 by [10up](http://10up.com) and its various contributors under the terms of the MIT license.