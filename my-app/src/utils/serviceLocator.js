import { envConfig } from '../config/environment';
import * as discoveryMock from '../mocks/discoveryMock';
import * as discoveryReal from '../services/discoveryService';

// Dependency Injector exporting either mock or real functions block 
// strictly dependent on the environment config.
const serviceLocator = {
  discovery: envConfig.useMockApi ? discoveryMock : discoveryReal,
  // we will add more services here as we go (e.g. notifications, user profile)
};

export default serviceLocator;
