docker run \
  --name camunda-dmn-tester \
   --rm \
   -it \
   -e TESTER_CONFIG_PATHS="/dmnConfigs,/server/src/test/resources/dmn-configs" \
   -v $(pwd)/dmns:/opt/docker/dmns \
   -v $(pwd)/dmnConfigs:/opt/docker/dmnConfigs \
   -p 8883:8883 \
   australia-southeast1-docker.pkg.dev/harmoney-core-platform-dev/harmoney/camunda-dmn-tester:latest