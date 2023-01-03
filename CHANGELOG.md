# Changelog

All notable changes to this project will be documented in this file.

### 0.1.0 (2023-01-03)

## Bug Fixes

* Settings button opens settings tab ([#71](https://github.com/Certora/vscode-certora-prover/pull/71))
* UI improvements in the settings form & results view ([#71](https://github.com/Certora/vscode-certora-prover/pull/71))
* Additional files always shows solc version, if it was provided ([#71](https://github.com/Certora/vscode-certora-prover/pull/71))
* Rename mode is fixed ([#71](https://github.com/Certora/vscode-certora-prover/pull/71))
* Rule Report button appears when running on staging as well ([#72](https://github.com/Certora/vscode-certora-prover/pull/72))

## Features

* Create jobs from conf files in certora/conf folder ([#72](https://github.com/Certora/vscode-certora-prover/pull/72))
* Modal that asks the user if they are sure before deleting a job list item ([#71](https://github.com/Certora/vscode-certora-prover/pull/71))
* Changed location of conf files to certora/conf directory, and log files to .certora_internal directory ([#72](https://github.com/Certora/vscode-certora-prover/pull/72))
* When clicking on the icon by a rule, create a new job with this one rule ([#76](https://github.com/Certora/vscode-certora-prover/pull/76))
* 'Staging' option moved to the end of 'Additional Prover Settings' in the Settings Form ([#76](https://github.com/Certora/vscode-certora-prover/pull/76))

### 0.0.4 (2022-11-23)

## Features 

* New settings form with a new design and better flags handling ([#67](https://github.com/Certora/vscode-certora-prover/pull/67))
* Run multiple jobs in parallel ([#67](https://github.com/Certora/vscode-certora-prover/pull/67))
* Manage jobs separately (job actions: rename, edit, delete, duplicate, run, show results - per job) ([#67](https://github.com/Certora/vscode-certora-prover/pull/67))

### 0.0.3 (2022-05-30)

## Bug Fixes

* Disable creation of an empty conf file ([#65](https://github.com/Certora/vscode-certora-prover/pull/65))
* Better handling of the file inputs ([#65](https://github.com/Certora/vscode-certora-prover/pull/65), [#66](https://github.com/Certora/vscode-certora-prover/pull/66))

## Features

* Add VSCode settings to set default values for conf file creation ([#64](https://github.com/Certora/vscode-certora-prover/pull/64))

### 0.0.2 (2022-05-15)

### Bug Fixes

* Add the main contract name to the "files" section in the conf file ([#60](https://github.com/Certora/vscode-certora-prover/pull/60))
* The ability to create a conf file and edit another conf file simultaneously ([#62](https://github.com/Certora/vscode-certora-prover/pull/62))

### Features

* Show the errors coming from the  prover in the problems view ([#61](https://github.com/Certora/vscode-certora-prover/pull/61))
