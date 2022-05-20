const NetlifyAPI = require("netlify");
const sites = {
  "e675dda5-c476-4e6b-850d-6cb6df3a39f3": {
    name: "Production",
    buildHook: "https://api.netlify.com/build_hooks/6286dfd714351656169a87f8",
  },
  "33f525cd-6f1d-4bf5-8a32-ff20fc1f0c21": {
    name: "QA",
    promoteTo: "e675dda5-c476-4e6b-850d-6cb6df3a39f3",
    buildHook: "https://api.netlify.com/build_hooks/6286dff8fa1410570855dfe5",
  },
  "5ade471d-9800-4baa-9101-7451966efd6b": {
    name: "Release",
    promoteTo: "33f525cd-6f1d-4bf5-8a32-ff20fc1f0c21",
  },
};

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
};

exports.handler = async function (event, context) {
  const client = new NetlifyAPI(process.env.NETLIFY_API_ACCESS_TOKEN);

  const path = event.path.replace(/\.netlify\/functions\/[^/]+/, "");
  const segments = path.split("/").filter((e) => e);

  switch (event.httpMethod) {
    case "GET":
      /* GET /.netlify/functions/api */
      if (segments.length === 0) {
        return {
          statusCode: 200,
          headers,
          body: "hello world",
        };
      }
      /* GET /.netlify/functions/api/sites */
      if (segments.length === 1 && segments[0] === "sites") {
        const filteredSites = [];
        for (const site in sites) {
          const siteData = sites[site];
          const deployData = await client.getSite({ site_id: site });
          filteredSites.push({
            ...siteData,
            id: site,
            url: deployData.ssl_url,
            publishedDeploy: deployData.published_deploy,
            promoteTo: {
              ...sites[siteData.promoteTo],
            },
          });
        }
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(filteredSites),
        };
      }
      /* GET /.netlify/functions/api/sites */
      if (segments.length === 2 && segments[0] === "sites") {
        const siteId = segments[1];
        const deploys = await client.listSiteDeploys({
          site_id: siteId,
        });
        const buildingDeploys = deploys.filter(
          (d) => d.context === "production" && d.state === "building"
        );
        const isBuilding = buildingDeploys.length > 0;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ isBuilding }),
        };
      } else {
        return {
          statusCode: 500,
          headers,
          body: "too many segments in GET request",
        };
      }
    /* POST /.netlify/functions/api */
    case "POST":
      return;
    /* Fallthrough case */
    default:
      return {
        statusCode: 500,
        headers,
        body: "unrecognized HTTP Method, must be one of GET/POST/PUT/DELETE",
      };
  }
};
