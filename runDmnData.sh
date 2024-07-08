docker run \
  --name camunda-dmn-runner \
   --rm \
   -it \
   -v $(pwd)/dmnCSV:/app/dmnCSV \
   -v $(pwd)/dmnConfigs:/app/dmnConfigs \
   -v $(pwd)/dmns:/app/dmns \
   -p 8882:8882 \
   camunda-dmn-runner