# Changelog

All notable changes to this project will be documented in this file.

### 0.2.1 (2023-10-23)

## Features

* Support newer versions of certora-cli ([#109](https://github.com/Certora/vscode-certora-prover/pull/109))

### 0.2.0 (2023-06-07)

## Features

* Support multiple repos workspace ([#96](https://github.com/Certora/vscode-certora-prover/pull/96))

### 0.1.9 (2023-06-01)

### Bug Fixes

* Added dual support for both CVL versions (CVL1+CVL2), according to the installed certora-cli version. ([#105](https://github.com/Certora/vscode-certora-prover/pull/105))
* Results are not lost if the IDE is re-loaded ([#105](https://github.com/Certora/vscode-certora-prover/pull/105))

### 0.1.8 (2023-05-15)

## Bug Fixes

* Removed unnecessary flags from conf files ([#101](https://github.com/Certora/vscode-certora-prover/pull/101))
* Duplicate button also works on jobs that were converted from shell scripts ([#101](https://github.com/Certora/vscode-certora-prover/pull/101))
## Features

* Compatibility with the latest certora-cli version ([#100](https://github.com/Certora/vscode-certora-prover/pull/100))
* Error handling for when a job failed because of system incompatibility issues ([#100](https://github.com/Certora/vscode-certora-prover/pull/100))
* New additions to "Job Failed" status, including a button to the log file ([#102](https://github.com/Certora/vscode-certora-prover/pull/102))

### 0.1.7 (2023-05-01)

## Bug Fixes

* When prover is unavailable, show in the ui that the job failed ([#98](https://github.com/Certora/vscode-certora-prover/pull/98))
* Show unable-to-run status when a job fails while the settings form of the job is open ([#98](https://github.com/Certora/vscode-certora-prover/pull/98))

### 0.1.6 (2023-04-27)

## Features

* Save last rule report link of a job run ([#97](https://github.com/Certora/vscode-certora-prover/pull/97))

### 0.1.4 (2023-04-02)

## Features

* Save last results of a job run ([#92](https://github.com/Certora/vscode-certora-prover/pull/92))

## Bug Fixes

* Shell script to conf file convertor: if main contract is not in the first file - still recognize the main contract ([#93](https://github.com/Certora/vscode-certora-prover/pull/93))

### 0.1.3 (2023-03-19)

## Features

* Create a job from a shell script file ([#88](https://github.com/Certora/vscode-certora-prover/pull/88))
* Added option to choose branch on production / staging ([#87](https://github.com/Certora/vscode-certora-prover/pull/87))
* Change icon in navigator when there is a validation error, added "Settings Error" state and better validation ([#87](https://github.com/Certora/vscode-certora-prover/pull/87))
* Show type / parse errors from the cli in the PROBLEMS view ([#87](https://github.com/Certora/vscode-certora-prover/pull/87))

## Bug Fixes

* Rename glitch when other jobs are running, rename when there are incomplete results will not stop receiving results ([#87](https://github.com/Certora/vscode-certora-prover/pull/87))
* Run-all statuses bug fixed ([#87](https://github.com/Certora/vscode-certora-prover/pull/87))
* Jobs that were stopped from the web (rule report) stops in the extension as well ([#87](https://github.com/Certora/vscode-certora-prover/pull/87))


### 0.1.2 (2023-01-25)
## Bug Fixes

* Results panes opens and closes ([#86](https://github.com/Certora/vscode-certora-prover/pull/86))
* Context menu is disabled white job is running ([#86](https://github.com/Certora/vscode-certora-prover/pull/86))

### 0.1.1 (2023-01-25)

## Features

* Job list item view update: moved and emphasize rule report button, removed "rename" button and added a context menu, removed hover from JOB LIST buttons ([#84](https://github.com/Certora/vscode-certora-prover/pull/84))
* Stopping a running job cancels the job in the cloud ([#84](https://github.com/Certora/vscode-certora-prover/pull/84))
* New "Expand All" / "Collapse All" buttons ([#84](https://github.com/Certora/vscode-certora-prover/pull/84))

## Bug Fixes
* Jobs results stay opened / closed on reopening the JOB LIST tab ([#84](https://github.com/Certora/vscode-certora-prover/pull/84))
* Send_only flag is automatically added to every conf file added to certora/conf directory ([#81](https://github.com/Certora/vscode-certora-prover/pull/81))
* additional files that don't explicitly mention the main contract in the .conf file "file" section are now handled correctly ([#81](https://github.com/Certora/vscode-certora-prover/pull/81))
* Wrong input in "Additional Flag" would'nt crush the extension ([#81](https://github.com/Certora/vscode-certora-prover/pull/81))
* Enforce using contracts with different names ([#81](https://github.com/Certora/vscode-certora-prover/pull/81))
* Can now add the "--settings" flag in "Additional Flags" under "Spec Settings" ([#81](https://github.com/Certora/vscode-certora-prover/pull/81))
* Validation error in an additional contract is deleted when the additional contract is deleted ([#81](https://github.com/Certora/vscode-certora-prover/pull/81))

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
