import express from 'express';
import { v4 } from 'uuid';
import { FullNode, Harvester, Wallet } from '../chia-client';
import { Connection } from '../contracts/connection';
import { db } from '../database/Database';
import { makeLogger } from '../logger';

type CreateConnectionResponse = void;
type CreateConnectionParams = Omit<Connection, '_id' | 'timestamp'>;

export default function init() {
  const router = express.Router();
  const logger = makeLogger('api.connection');
  const handleError = (error, res: express.Response) => {
    logger.error(error);
    res.status(400);
    switch (error?.code) {
      case 'MISSINGPROPERTIES':
        return res.send('Missing required properties');
      case 'ENOENT':
      case 'ECONNRESET':
        return res.send('Invalid credentials');
      case 'ECONNREFUSED':
        return res.send('Connection refused');
      default:
        return res.send('Connection refused');
    }
  };
  router.post<{}, CreateConnectionResponse | Error, CreateConnectionParams>(
    '/fullNode',
    async (req, res) => {
      const connectionToAdd = req.body;
      const fullNode = new FullNode({
        protocol: "https",
        hostname: "127.0.0.1",
        port: 8555,
        certPath: "-----BEGIN CERTIFICATE-----\nMIIDLDCCAhSgAwIBAgIUFtvBuCb/Bt/sD1lUv2LVyP7YDagwDQYJKoZIhvcNAQEL\nBQAwRDENMAsGA1UECgwEQ2hpYTEQMA4GA1UEAwwHQ2hpYSBDQTEhMB8GA1UECwwY\nT3JnYW5pYyBGYXJtaW5nIERpdmlzaW9uMCAXDTIxMDUxMTEwMTMzOVoYDzIxMDAw\nODAyMDAwMDAwWjBBMQ0wCwYDVQQDDARDaGlhMQ0wCwYDVQQKDARDaGlhMSEwHwYD\nVQQLDBhPcmdhbmljIEZhcm1pbmcgRGl2aXNpb24wggEiMA0GCSqGSIb3DQEBAQUA\nA4IBDwAwggEKAoIBAQDQxZMbPffpMJNme/dvzm/pSGIETlssIHIY1iXvv5Q0xrp2\nfzzEk/UPxfO4EU9Ui6fQof2GKbjZX1uygNbMMBVOagi7oNe3YVIT6engDsxLG2gT\nJNGubbGN6WlskHdPP1Ekn9EtN9txxr2/9xaIkKdLAfl+xwEiU95jSCHn4gVsoaos\nG8OEHkOjIn7CvrDa8139m7szxr9DG8zo2nvBQ8g24sXxFJL3YVORRxJ3aE4i6OhP\nXbPtlU7MVAGjWaHZn7W6nNfyBwuqgc+dsYlY4x6xkb5Wv1tZQAvE5UJLzID15P0P\n6mU0oe9MizjxRKr+RyPX25wk57bkPCIxGNYHbeQhAgMBAAGjFzAVMBMGA1UdEQQM\nMAqCCGNoaWEubmV0MA0GCSqGSIb3DQEBCwUAA4IBAQAnYEQqSvdDFGEB6vJmyoNN\nM5qEnUpvL7wAESXSUQH+DufxgSmP9lP5v3JMJb+OcA2YG6GjgQ/ux5BlTM+2ma1b\n7Q6vH0FRhiPeLsOA6/MrRpa5hPNGgNj2yyrpceqV0vkTnrVcrPUfdxPFnBA69BWy\niw5jyJIksOpjuynvRCSx1EcuwOoYcgmKaexCi+gHfq+DWMhv9xRzSf25LvtxAzFW\n+sl/61v3bhsrYC3OLE3YpHQXThWJmS+dBXekCqUNQxUWqb07v+lRueuSemQocPWQ\nJIJg/CtRpxTKhDSiEZ66UQ7PMeJxXnsv1+At9G45ZFiNLOwcCN8bRtv21sP4TUAY\n-----END CERTIFICATE-----",
        keyPath: "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0MWTGz336TCTZnv3b85v6UhiBE5bLCByGNYl77+UNMa6dn88\nxJP1D8XzuBFPVIun0KH9him42V9bsoDWzDAVTmoIu6DXt2FSE+np4A7MSxtoEyTR\nrm2xjelpbJB3Tz9RJJ/RLTfbcca9v/cWiJCnSwH5fscBIlPeY0gh5+IFbKGqLBvD\nhB5DoyJ+wr6w2vNd/Zu7M8a/QxvM6Np7wUPINuLF8RSS92FTkUcSd2hOIujoT12z\n7ZVOzFQBo1mh2Z+1upzX8gcLqoHPnbGJWOMesZG+Vr9bWUALxOVCS8yA9eT9D+pl\nNKHvTIs48USq/kcj19ucJOe25DwiMRjWB23kIQIDAQABAoIBAChUQlqc2eseCxtd\nDyt2AYBbDzQtvscDbYcGt0VdCNA5I4QIiEChJFHrt2zzSxPV9pEC+eqU3LSBC0Gs\nSdIf573CFfXI2GMAVc6q/RbfRO+tV6l7D1ZWslnroQXr0mBoptAgX1QQ2j9cWQNg\nQ+YVq3t94ihvYPS0pt0e7g3RR6L4LnxwCLQBbCvWKMhZblBKfUHyQBwYfWxXkNWJ\ndAHxTXpH+qcPew3jdc7Qq+Tif4ETr2GON+eY/db641O3g51ftXe/YWIeGKOJFQk0\nVqOxVba9z8TQ3aZQUqVmvsYexcGpKG2HtYvTGzj+WC6EReVc7O3fn4YWiqSQPhzD\nS23S9cECgYEA70MG7dxPie9ubLnH2WxQPB0K8ZBjvtkry9s09PTWTEJJJPjayTtY\nAcWQ35sOxkCnYvRXmelQM3Agz5onUKVZa0SjsBA3H7SlR82vg7wsg+lJ+/UHfTmW\nEbPCB5OcxwOSLgbj+0OldLkuYxY6ohABwZOWT/wPOGWcfhR+nLKagH0CgYEA32B/\nQXlWNCLKtKS0Ds2pFiPfH5I6H8e+ZeTqVAPjWEsyuX9Cj8scahiVOUzP23I/PzQW\nAaI4N5boVJoVnd1rCTKo+ejHX4L4bJbLbYxgB5IY4FY4Qz8B4QnpJo/LMG8R0OwQ\nySbsUjZQRkSVoiyTeNuYQcWO9IYBszeCMoOwx3UCgYEA7GCw+NA+uIyW8M2+dry+\nrBUZWbyH/uX5keZYdGVrTl3ye5dsN4DsmpuAXJmJSC5Z8LZr0YAinx75G4E1tEQX\nipV+jhQHEcjbvYulCiYfaJdTY5wZsQryizynxep86lVJ1zUxiWy0ixPkkzpD5Rah\nVYik6RKiStqAeENxLwh5AdUCgYBD6n0GlTPGikWDgwhT7+fXGXT/jmApxXt4U4+D\nl+MJt2NmzvCX87Nh9rN4Roh0OlpMhzOhr4bUMAfXoTmtU+L1WvfRdBsaSSHrMjYL\nysBvzNXPb6ePmpqhp3fCB7pJsZuDICNCZZk4rdbeZn/wXQlBl9LFPKHoas4dhWUK\nosue+QKBgFIPeQZUSO2IUuHzrZGjQLb/S9gyxS/9alKDGzPHkPy5NMIQzV1D+9kv\ns1do3Ck1kTIAyv6kXjCmcSzoy5gy9fR4/Y3t/TBho9fVApQKiaVeOdTlHxGd2gr3\nggy7BUW0ifovBlvuuXlDf6qk7O0yTOK8wuJROhCGZuQstzgZBN3M\n-----END RSA PRIVATE KEY-----"
        // certPath: connectionToAdd.crt,
        // keyPath: connectionToAdd.key,
      });
      console.log(connectionToAdd.crt,connectionToAdd.key)
      const blockchain = await fullNode.getBlockchainState();
      console.log(blockchain)
      // if (Object.values(connectionToAdd).some((property) => !property)) {
      //   return handleError({ code: 'MISSINGPROPERTIES' }, res);
      // }
      // try {
      //   const fullNode = new FullNode({
      //     hostname: connectionToAdd.host,
      //     port: connectionToAdd.port,
      //     certPath: connectionToAdd.crt,
      //     keyPath: connectionToAdd.key,
      //   });
      //   console.log(JSON.stringify(fullNode.getBlockchainState()))
      //   await fullNode.getBlockchainState();
      //   await db.connection.asyncInsert({
      //     ...connectionToAdd,
      //     _id: v4(),
      //     timestamp: new Date(),
      //   });
      //   res.status(201);
      //   res.send();
      // } catch (error) {
      //   return handleError(error, res);
      // }
    }
  );

  router.post<{}, CreateConnectionResponse | Error, CreateConnectionParams>(
    '/wallet',
    async (req, res) => {
      const connectionToAdd = req.body;
      const wallet = new Wallet({
        protocol: "https",
        hostname: "127.0.0.1",
        port: 9256,
        certPath: "-----BEGIN CERTIFICATE-----\nMIIDLDCCAhSgAwIBAgIUFtvBuCb/Bt/sD1lUv2LVyP7YDagwDQYJKoZIhvcNAQEL\nBQAwRDENMAsGA1UECgwEQ2hpYTEQMA4GA1UEAwwHQ2hpYSBDQTEhMB8GA1UECwwY\nT3JnYW5pYyBGYXJtaW5nIERpdmlzaW9uMCAXDTIxMDUxMTEwMTMzOVoYDzIxMDAw\nODAyMDAwMDAwWjBBMQ0wCwYDVQQDDARDaGlhMQ0wCwYDVQQKDARDaGlhMSEwHwYD\nVQQLDBhPcmdhbmljIEZhcm1pbmcgRGl2aXNpb24wggEiMA0GCSqGSIb3DQEBAQUA\nA4IBDwAwggEKAoIBAQDQxZMbPffpMJNme/dvzm/pSGIETlssIHIY1iXvv5Q0xrp2\nfzzEk/UPxfO4EU9Ui6fQof2GKbjZX1uygNbMMBVOagi7oNe3YVIT6engDsxLG2gT\nJNGubbGN6WlskHdPP1Ekn9EtN9txxr2/9xaIkKdLAfl+xwEiU95jSCHn4gVsoaos\nG8OEHkOjIn7CvrDa8139m7szxr9DG8zo2nvBQ8g24sXxFJL3YVORRxJ3aE4i6OhP\nXbPtlU7MVAGjWaHZn7W6nNfyBwuqgc+dsYlY4x6xkb5Wv1tZQAvE5UJLzID15P0P\n6mU0oe9MizjxRKr+RyPX25wk57bkPCIxGNYHbeQhAgMBAAGjFzAVMBMGA1UdEQQM\nMAqCCGNoaWEubmV0MA0GCSqGSIb3DQEBCwUAA4IBAQAnYEQqSvdDFGEB6vJmyoNN\nM5qEnUpvL7wAESXSUQH+DufxgSmP9lP5v3JMJb+OcA2YG6GjgQ/ux5BlTM+2ma1b\n7Q6vH0FRhiPeLsOA6/MrRpa5hPNGgNj2yyrpceqV0vkTnrVcrPUfdxPFnBA69BWy\niw5jyJIksOpjuynvRCSx1EcuwOoYcgmKaexCi+gHfq+DWMhv9xRzSf25LvtxAzFW\n+sl/61v3bhsrYC3OLE3YpHQXThWJmS+dBXekCqUNQxUWqb07v+lRueuSemQocPWQ\nJIJg/CtRpxTKhDSiEZ66UQ7PMeJxXnsv1+At9G45ZFiNLOwcCN8bRtv21sP4TUAY\n-----END CERTIFICATE-----",
        keyPath: "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0MWTGz336TCTZnv3b85v6UhiBE5bLCByGNYl77+UNMa6dn88\nxJP1D8XzuBFPVIun0KH9him42V9bsoDWzDAVTmoIu6DXt2FSE+np4A7MSxtoEyTR\nrm2xjelpbJB3Tz9RJJ/RLTfbcca9v/cWiJCnSwH5fscBIlPeY0gh5+IFbKGqLBvD\nhB5DoyJ+wr6w2vNd/Zu7M8a/QxvM6Np7wUPINuLF8RSS92FTkUcSd2hOIujoT12z\n7ZVOzFQBo1mh2Z+1upzX8gcLqoHPnbGJWOMesZG+Vr9bWUALxOVCS8yA9eT9D+pl\nNKHvTIs48USq/kcj19ucJOe25DwiMRjWB23kIQIDAQABAoIBAChUQlqc2eseCxtd\nDyt2AYBbDzQtvscDbYcGt0VdCNA5I4QIiEChJFHrt2zzSxPV9pEC+eqU3LSBC0Gs\nSdIf573CFfXI2GMAVc6q/RbfRO+tV6l7D1ZWslnroQXr0mBoptAgX1QQ2j9cWQNg\nQ+YVq3t94ihvYPS0pt0e7g3RR6L4LnxwCLQBbCvWKMhZblBKfUHyQBwYfWxXkNWJ\ndAHxTXpH+qcPew3jdc7Qq+Tif4ETr2GON+eY/db641O3g51ftXe/YWIeGKOJFQk0\nVqOxVba9z8TQ3aZQUqVmvsYexcGpKG2HtYvTGzj+WC6EReVc7O3fn4YWiqSQPhzD\nS23S9cECgYEA70MG7dxPie9ubLnH2WxQPB0K8ZBjvtkry9s09PTWTEJJJPjayTtY\nAcWQ35sOxkCnYvRXmelQM3Agz5onUKVZa0SjsBA3H7SlR82vg7wsg+lJ+/UHfTmW\nEbPCB5OcxwOSLgbj+0OldLkuYxY6ohABwZOWT/wPOGWcfhR+nLKagH0CgYEA32B/\nQXlWNCLKtKS0Ds2pFiPfH5I6H8e+ZeTqVAPjWEsyuX9Cj8scahiVOUzP23I/PzQW\nAaI4N5boVJoVnd1rCTKo+ejHX4L4bJbLbYxgB5IY4FY4Qz8B4QnpJo/LMG8R0OwQ\nySbsUjZQRkSVoiyTeNuYQcWO9IYBszeCMoOwx3UCgYEA7GCw+NA+uIyW8M2+dry+\nrBUZWbyH/uX5keZYdGVrTl3ye5dsN4DsmpuAXJmJSC5Z8LZr0YAinx75G4E1tEQX\nipV+jhQHEcjbvYulCiYfaJdTY5wZsQryizynxep86lVJ1zUxiWy0ixPkkzpD5Rah\nVYik6RKiStqAeENxLwh5AdUCgYBD6n0GlTPGikWDgwhT7+fXGXT/jmApxXt4U4+D\nl+MJt2NmzvCX87Nh9rN4Roh0OlpMhzOhr4bUMAfXoTmtU+L1WvfRdBsaSSHrMjYL\nysBvzNXPb6ePmpqhp3fCB7pJsZuDICNCZZk4rdbeZn/wXQlBl9LFPKHoas4dhWUK\nosue+QKBgFIPeQZUSO2IUuHzrZGjQLb/S9gyxS/9alKDGzPHkPy5NMIQzV1D+9kv\ns1do3Ck1kTIAyv6kXjCmcSzoy5gy9fR4/Y3t/TBho9fVApQKiaVeOdTlHxGd2gr3\nggy7BUW0ifovBlvuuXlDf6qk7O0yTOK8wuJROhCGZuQstzgZBN3M\n-----END RSA PRIVATE KEY-----"
        // certPath: connectionToAdd.crt,
        // keyPath: connectionToAdd.key,
      });
      const address = await wallet.getNextAddress("1")
      const getWallets = await wallet.getWallets()
      console.log(address)
      console.log(getWallets)
      const x = await wallet.getHeightInfo();
      console.log('wallet height', x);
      // if (Object.values(connectionToAdd).some((property) => !property)) {
      //   return handleError({ code: 'MISSINGPROPERTIES' }, res);
      // }
      // try {
      //   const wallet = new Wallet({
      //     hostname: connectionToAdd.host,
      //     port: connectionToAdd.port,
      //     certPath: connectionToAdd.crt,
      //     keyPath: connectionToAdd.key,
      //   });
      //   const address = await wallet.getNextAddress(connectionToAdd.id)
      //   const getWallets = await wallet.getWallets()
      //   console.log(address)
      //   console.log(getWallets)
      //   const x = await wallet.getHeightInfo();
      //   console.log('wallet height', x);
      //   await db.connection.asyncInsert({
      //     ...connectionToAdd,
      //     _id: v4(),
      //     timestamp: new Date(),
      //   });
      //   res.status(201);
      //   res.send();
      // } catch (error) {
      //   return handleError(error, res);
      // }
    }
  );
  router.post<{}, CreateConnectionResponse | Error, CreateConnectionParams>(
    '/harvester',
    async (req, res) => {
      const connectionToAdd = req.body;
      if (Object.values(connectionToAdd).some((property) => !property)) {
        return handleError({ code: 'MISSINGPROPERTIES' }, res);
      }
      try {
        const harvester = new Harvester({
          hostname: connectionToAdd.host,
          port: connectionToAdd.port,
          certPath: connectionToAdd.crt,
          keyPath: connectionToAdd.key,
        });
        await harvester.getPlotDirectories();
        await db.connection.asyncInsert({
          ...connectionToAdd,
          _id: v4(),
          timestamp: new Date(),
        });
        res.status(201);
        res.send();
      } catch (error) {
        return handleError(error, res);
      }
    }
  );
  router.post<{}, CreateConnectionResponse | Error, CreateConnectionParams>(
    '/chiaExplorer',
    async (req, res) => {
      const connectionToAdd = req.body;
      if (
        !connectionToAdd.name ||
        !connectionToAdd.crt ||
        !connectionToAdd.key
      ) {
        return handleError({ code: 'MISSINGPROPERTIES' }, res);
      }
      try {
        await db.connection.asyncInsert({
          ...connectionToAdd,
          _id: v4(),
          timestamp: new Date(),
        });
        res.status(201);
        res.send();
      } catch (error) {
        return handleError(error, res);
      }
    }
  );
  return router;
}
