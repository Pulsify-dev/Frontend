import { envConfig } from '../config/environment';
import * as discoveryMock from '../mocks/discoveryMock';
import * as discoveryReal from '../services/discoveryService';
import * as notificationMock from '../mocks/notificationMock';
import * as notificationReal from '../services/notificationService';

// Dependency Injector exporting either mock or real functions block
// strictly dependent on the environment config.
const serviceLocator = {
  discovery: envConfig.useMockApi ? discoveryMock : discoveryReal,
  notifications: envConfig.useMockApi ? notificationMock : notificationReal,
};

export default serviceLocator;
