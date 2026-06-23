const mongoSanitize = require('express-mongo-sanitize');
const req = {
  headers: {
    'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
    cookie: 'verve_admin_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
};
['body', 'params', 'query', 'headers'].forEach((k) => {
  if (req[k]) {
    mongoSanitize.sanitize(req[k]);
  }
});
console.log(req.headers);
