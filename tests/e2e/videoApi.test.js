const request = require("supertest");
const app = require("../../app");
const { sequelize } = require("../../config/database");
const Video = require("../../models/videoModel");
const path = require("path");
const fs = require("fs");

beforeAll(async () => {
  await sequelize.sync();
  // await Video.create({
  //   title: "Sample Video",
  //   size: 1024 * 1024 * 5,
  //   duration: 120,
  //   filePath: path.join(__dirname, "..", "..", "uploads", "sample.mp4"),
  // });

  // await Video.bulkCreate([
  //   {
  //     title: "Sample Video 1",
  //     size: 1024 * 1024 * 5,
  //     duration: 120,
  //     filePath: path.join(__dirname, "..", "..", "uploads", "sample1.mp4"),
  //   },
  //   {
  //     title: "Sample Video 2",
  //     size: 1024 * 1024 * 5,
  //     duration: 150,
  //     filePath: path.join(__dirname, "..", "..", "uploads", "sample2.mp4"),
  //   },
  // ]);
});

afterAll(async () => {
  const files = fs.readdirSync(path.join(__dirname, "..", "..", "uploads"));
  files
    .filter((f) => f.startsWith("trimmed_"))
    .forEach((file) =>
      fs.unlinkSync(path.join(__dirname, "..", "..", "uploads", file))
    );
  await sequelize.close();
});

describe("Video Controller", () => {
  let existsSyncSpy;

  beforeEach(() => {
    existsSyncSpy = jest.spyOn(fs, "existsSync");
  });

  afterEach(() => {
    existsSyncSpy.mockRestore();
  });

  it("should upload a video", async () => {
    const response = await request(app)
      .post("/api/videos/upload")
      .field("title", "Test Video 2")
      .attach("file", process.env.Test_Video_2);

    console.log(response.body);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
  });

  it("should trim the video", async () => {
    const video = await Video.findOne({ where: { title: "video_3" } });

    const response = await request(app).post("/api/videos/trim").send({
      title: video.title,
      trimStart: 5,
      trimEnd: 10,
    });

    console.log(response.body);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "Video trimmed successfully"
    );
    expect(fs.existsSync(response.body.filePath)).toBe(true);

    fs.unlinkSync(response.body.filePath);
  });

  it("should merge videos with valid titles", async () => {
    jest.setTimeout(30000);
    const response = await request(app)
      .post("/api/videos/merge")
      .send({ titles: ["video_3", "video_4"] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "Videos merged successfully"
    );
    expect(fs.existsSync(response.body.filePath)).toBe(true);
  }, 30000);

  it("should share a video link successfully", async () => {
    const response = await request(app).post("/api/videos/share").send({
      title: "video_3",
      expiryTime: 2,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "Video link shared successfully"
    );
    expect(response.body).toHaveProperty("link");
    expect(new Date(response.body.expiryTime)).toBeInstanceOf(Date);
    expect(new Date(response.body.expiryTime).getTime()).toBeGreaterThan(
      Date.now()
    );
  });
});


