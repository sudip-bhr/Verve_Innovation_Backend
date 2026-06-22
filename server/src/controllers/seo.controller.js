const { SitemapStream, streamToPromise } = require('sitemap');
const { createGzip } = require('zlib');
const CaseStudy = require('../models/CaseStudy');
const Service = require('../models/Service');
const Blog = require('../models/Blog');

let sitemap;

exports.generateSitemap = async (req, res, next) => {
  res.header('Content-Type', 'application/xml');
  res.header('Content-Encoding', 'gzip');

  // Return the cached sitemap if it exists
  if (sitemap) {
    res.send(sitemap);
    return;
  }

  try {
    const smStream = new SitemapStream({ hostname: 'https://verveinnovation.com.np' });
    const pipeline = smStream.pipe(createGzip());

    // Add static routes
    smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });
    smStream.write({ url: '/about', changefreq: 'monthly', priority: 0.8 });
    smStream.write({ url: '/services', changefreq: 'monthly', priority: 0.9 });
    smStream.write({ url: '/cases', changefreq: 'weekly', priority: 0.9 });
    smStream.write({ url: '/contact', changefreq: 'monthly', priority: 0.8 });

    // Add dynamic Case Studies
    const cases = await CaseStudy.find({}).select('slug updatedAt');
    cases.forEach(item => {
      smStream.write({
        url: `/cases/${item.slug}`,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: item.updatedAt
      });
    });

    // Add dynamic Services
    // Assuming Services might not have a detail page yet, but just in case they do:
    // const services = await Service.find({}).select('slug updatedAt');
    // services.forEach(item => {
    //   if(item.slug) {
    //     smStream.write({
    //       url: `/services/${item.slug}`,
    //       changefreq: 'monthly',
    //       priority: 0.7,
    //       lastmod: item.updatedAt
    //     });
    //   }
    // });

    // Add dynamic Blogs
    const blogs = await Blog.find({}).select('slug updatedAt');
    blogs.forEach(item => {
      if(item.slug) {
        smStream.write({
          url: `/blogs/${item.slug}`,
          changefreq: 'weekly',
          priority: 0.7,
          lastmod: item.updatedAt
        });
      }
    });

    // Cache the response
    streamToPromise(pipeline).then(sm => sitemap = sm);
    
    // Make sure to attach a write stream such as streamToPromise before ending
    smStream.end();
    
    // Stream write the response
    pipeline.pipe(res).on('error', (e) => {throw e});
  } catch (error) {
    console.error('Sitemap Generation Error:', error);
    res.status(500).end();
  }
};

exports.getRobotsTxt = (req, res) => {
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://verveinnovation.com.np/sitemap.xml
`;
  res.type('text/plain');
  res.send(robotsTxt);
};
