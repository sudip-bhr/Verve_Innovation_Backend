const mongoSanitize = require('express-mongo-sanitize');
const req = {
  headers: {
    cookie: "verve_admin_token=fake_token"
  }
};
['body', 'params', 'query', 'headers'].forEach((k) => {
  if (req[k]) {
    mongoSanitize.sanitize(req[k]);
  }
});
console.log(req.headers);
