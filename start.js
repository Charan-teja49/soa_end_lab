const { startAccountService } = require('./account-service');
const { startGateway } = require('./gateway');

const accountPort = Number(process.env.ACCOUNT_PORT || 8081);
const gatewayPort = Number(process.env.GATEWAY_PORT || 8080);
const services = [startAccountService(accountPort), startGateway(gatewayPort, accountPort)];
for (const server of services) {
  server.on('error', error => {
    console.error(`Unable to start: ${error.message}`);
    for (const service of services) service.close();
    process.exitCode = 1;
  });
}
function stop() {
  for (const server of services) server.close();
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
