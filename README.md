# docker-registry-swift-gc
A quick utility to query and perform garbage collection on a [docker registry](https://github.com/docker/docker-registry) which has been attached to [swift object storage](http://docs.openstack.org/developer/swift/) using [docker-registry-driver-swift](https://github.com/bacongobbler/docker-registry-driver-swift).

This allows you to query the following docker registry types, **repository tags**, **all image layers**, **unused image layers** and **used image layers**. It also will allow you to perform garbage collection on your storage (**TODO**).


## Installation
```sh
git clone https://github.com/Samze/docker-registry-swift-gc.git
cd docker-registry-swift-gc
npm install
```

## Setup
This uses the Identity Service authorization specified here: http://docs.openstack.org/api/openstack-object-storage/1.0/content/examples.html#get_auth_token_keystone

Setup the following environment variables.

```sh
export OS_USERNAME= # The username to pass to the auth service (X-Auth-User)
export OS_PASSWORD= # The password to send to the auth service (X-Auth-Key)
export OS_AUTH_URL= # URL endpoint of identify service.
export CONTAINER= # The container that the Docker registry is pointing to.

```

## Usage

Get summary information of your docker-registry swift storage.
```sh
root@vagrant-ubuntu-precise-64:~# node index.js summary
Successfully Authenticated
Total tags: 333
Total image layers: 1534
Unused image layers: 505
```

You can call **count** or **list** on the various types listed below:
* tagged
* all_images
* unused_images
* used_images

For example, counting the total number of images.
```sh
root@vagrant-ubuntu-precise-64:~# node index.js count all_images
Successfully Authenticated
1534
```

Or listing all of the unreferenced images.
```sh
root@vagrant-ubuntu-precise-64:~# node index.js list unused_images
Successfully Authenticated
[ '001e31ae2968621d898886ed58234cb9f23768b1d1fffa2f482ff8028a8a02c3',
  '0073f47473199357ea901a5da16292eac1e2c456d69de349e050a8d6c6ddf4ac',
  '00fbf496d9efa80fa1a7ace151a69b42ac1e6d884a9f254e54e7362cc1b6a019',
  '012fc570695aea5ba5b1a8de303f531388015e17cef5cb785b664834b4934ffb',
  '0260d8f95d5a65f47997e468e8c34685008eeff0474bd51529135cdfbcdd5d6d',
  '027a800332dc7d1e076227cea9a79d051a9791f108c3cdf54f4ddb7d340cd443',
  '02d624bc6e9747194d96c768f2d37c39cd9a4f29e068247539347173ddde2e37',
  ..................................................................
```

## License
Apache 2.0




