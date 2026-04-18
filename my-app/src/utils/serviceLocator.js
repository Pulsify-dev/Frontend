import { envConfig } from '../config/environment';
import * as discoveryMock from '../mocks/discoveryMock';
import * as discoveryReal from '../services/discoveryService';
import * as notificationMock from '../mocks/notificationMock';
import * as notificationReal from '../services/notificationService';
import * as moderationMock from '../mocks/moderationMockService';
import * as moderationReal from '../services/moderationService';

// Dependency Injector exporting either mock or real functions block
// strictly dependent on the environment config.
const serviceLocator = {
  discovery: envConfig.useMockApi ? discoveryMock : discoveryReal,
  notifications: envConfig.useMockApi ? notificationMock : notificationReal,
  moderation: envConfig.useMockApi ? moderationMock : moderationReal,
};

export default serviceLocator;
