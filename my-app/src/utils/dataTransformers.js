// Convert API responses from snake_case to camelCase
export const transformSnakeToCamel = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => transformSnakeToCamel(item));
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = transformSnakeToCamel(obj[key]);
      return result;
    }, {});
  }

  return obj;
};

export const transformCamelToSnake = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => transformCamelToSnake(item));
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = transformCamelToSnake(obj[key]);
      return result;
    }, {});
  }

  return obj;
};
