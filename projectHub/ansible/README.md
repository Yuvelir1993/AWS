# General
Ansible scripts for provisioning AWS resources and deploying app.

# Deploying
For deploying the app next parts to be considered:
- ../app/build
- ../backend/dist
- ../backend/package.json
  - 'npm i --production'
  - 'npm run start'

# Ansible commands
## Hints
Use `--check` for validation.
Use `--step` flag to execute with prompts.
Use `--tags <tag>` to execute only tagged.
Use `-e <variable>` to pass variable value.
Use `--ask-become-pass` to explicitly provide sudo password when `become: true`.

Ping hosts with `ANSIBLE_CONFIG=ansible.cfg ansible all -m ping`

## List inventories
Will call AWS API to return available hosts.
`ANSIBLE_CONFIG=ansible.cfg ansible-inventory --list`
`ANSIBLE_CONFIG=ansible.cfg ansible-inventory --graph`

## Play playbooks
Do not use `sudo` since `become: true` automatically elevates needed permissions.
1. `ANSIBLE_CONFIG=ansible.cfg ansible-playbook ./playbooks/provision.yml`
2. `ANSIBLE_CONFIG=ansible.cfg ansible-playbook ./playbooks/build_deploy.yml`

### Verify deployment package
```bash
unzip ./build/projectHubApp.zip -d ./projectHubApp_build
tree ./projectHubApp_build
```


# Troubleshooting

## UNREACHABLE

In case of error like below log in with `sudo su`:
```bash
ec2-3-71-181-6.eu-central-1.compute.amazonaws.com | UNREACHABLE! => {
    "changed": false,
    "msg": "Failed to connect to the host via ssh: ubuntu@ec2-3-71-181-6.eu-central-1.compute.amazonaws.com: Permission denied (publickey).",
    "unreachable": true
}
```