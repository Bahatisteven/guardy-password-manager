import client from "prom-client";


const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();  // collect default metrics like cpu usage, memory usage, etc.


const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labalNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 1.5, 2, 5]  // buckets for response time
});


const metricsMiddleware = (req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer()
  res.on("finish", () => {
    end({
      method: req.method,
      route: req.route?.path || req.url,
      status_code: res.statusCode
    });
  });
  next();
};


const metricsRoute = async (req, res) => {
  console.log("Metrics route hit!")
  res.set("Content-Type", client.register.contentType);
  const metrics = await client.register.metrics(); // res.end(client.register.metrics());
  res.end(metrics);
};

export { metricsMiddleware, metricsRoute};