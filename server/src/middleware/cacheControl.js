/**
 * cacheControl middleware
 *
 * Applies a Cache-Control header to GET responses for semi-static routes
 * (services, team, stats) that change infrequently. This tells browsers and
 * CDN edges to cache these responses for up to 5 minutes, reducing
 * unnecessary DB round-trips.
 *
 * Usage: router.get('/services', cacheControl('public, max-age=300'), handler)
 *
 * NOTE: Do NOT apply to /api/contact or any mutating route.
 */
function cacheControl(value) {
  return (req, res, next) => {
    if (req.method === 'GET') {
      res.set('Cache-Control', value);
    }
    next();
  };
}

module.exports = cacheControl;
