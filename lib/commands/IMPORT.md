# Importing Projects

## General Routines

### Parse JSON

Read the specified `manifest.json` file into memory.

### Parse Configuration

Merge the specified manifest fields with expected defaults and begin prepping the VM environment.

### Ensure Vagrant is running

Check if the VM is responsive and, if not, attempt to run `vagrant up`

### Create a Project Directory

Creates the following project structure:

```
/projects
.. /{project}
.. .. /config
.. .. .. /nginx
.. .. .. .. /sites
.. .. .. .. /config.d
.. .. /vendor
.. .. .. /plugins
.. .. .. /mu-plugins
.. .. .. /themes
.. .. /src
.. .. .. /plugins
.. .. .. /mu-plugins
.. .. .. /themes
.. .. .. /config
.. .. /util

### Update Status

Update the `.derrick.d` global entry for the installation

### Move Manifest File

Write out a `manifest.json` file in the project root

### Run Import

Several tasks run concurrently, including:

- Install dev resources
- Install vendor resources
- Create MU plugin autoloader
- Create database
- Create WordPress config file
- Create Nginx config files

### Mount Filesystem

Create a mounted unionfs directory in `/fs/{project}` on the guest VM that maps both the `/vendor` and `/src` directories atop one another.

### Import Database

Download the database (if required) and decompress the tarball of the export file. Then, once uncompressed, import the database dump.

### Import Uploads

Download the tarball of uploaded content for the site an copy the files to the `/uploads` diretcory for the project.

### Write Compiled Data

Write out a `manifest.lock` file with processed project information

### Create Docker Chain

Create all of the required Docker containers and link them together as required.

### Update hosts

Update the `aliases` file in the Derrick root to contain new development domains.

### Resync hosts

Execute `vagrant ghost` to update the local hosts file.

## Import Project Manifest

The system must first download the `manifest.json` file to a temporary location and load its contents into memory. Once loaded, the import process behaves identically to the import of a newly-created project.

## Pseudo-import of New Project

This process includes:

- Parse configuration
- Ensure Vagrant is running
- Create a project directory
- Update global status
- Create a `manifest.json` file in the project directory
- Install dev resources (1)
- Install vendor resources (1)
- Create MU plugin autoloader (1)
- Create database (1)
- Create WordPress config file (1)
- Create Nginx config files (1)
- Mount filesystem
- Import the database dump specified in the manifest file
- Import uploads from the tarball specified in the manifest file
- Write out the hosts map and the `manifest.lock` file
- Create the Docker chain
- Update the local `aliases` file
- Resync the hosts file

(1) These tasks are run concurrently.

## Project Re-import

The system will scan for any subdirectories of `/projects` and, one at a time, re-import each project. This will include an abbreviated run of:

- Update global status
- Create database
- Mount filesystem
- Import database - from the `/sys/backups` directory
- Create the Docker chain
- Resync the hosts file