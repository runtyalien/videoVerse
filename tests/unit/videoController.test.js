const request = require("supertest");
const app = require("../../app");
const { sequelize } = require("../../config/database");
const Video = require("../../models/videoModel");
const path = require("path");
const fs = require("fs");
const { title } = require("process");

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

  beforeAll(() => {
      existsSyncSpy = jest.spyOn(fs, 'existsSync');
  });

  afterEach(() => {
      jest.clearAllMocks();
  });

  afterAll(() => {
      existsSyncSpy.mockRestore();
  });

  it("should upload a video", async () => {
    const response = await request(app)
      .post("/api/videos/upload")
      .field("title", "Test Video 1")
      .attach("file", process.env.Test_Video_1);

    console.log(response.body);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("title");
  });

  it("should trim the video with valid trimStart and trimEnd", async () => {
    const video = await Video.findOne({ where: { title: "video_1" } });

    const response = await request(app).post("/api/videos/trim").send({
      title: video.title,
      trimStart: 5,
      trimEnd: 15,
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

  it("should return 400 for invalid trimStart or trimEnd", async () => {
    const video = await Video.findOne({ where: { title: "video_1" } });

    const response = await request(app).post("/api/videos/trim").send({
      title: video.title,
      trimStart: -10,
      trimEnd: 15,
    });

    console.log(response.body);
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid trimStart time.");
  });

  it("should return 400 if title is missing", async () => {
    const response = await request(app).post("/api/videos/trim").send({
      trimStart: 5,
      trimEnd: 15,
    });

    console.log(response.body);
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Invalid id, trimStart, or trimEnd."
    );
  });

  it("should return 404 if video not found", async () => {
    const response = await request(app).post("/api/videos/trim").send({
      title: "asdfdfdsaf",
      trimStart: 5,
      trimEnd: 15,
    });

    console.log(response.body);
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Video not found.");
  });

  it("should merge videos with valid titles", async () => {
    jest.setTimeout(30000);
    const response = await request(app)
      .post("/api/videos/merge")
      .send({ titles: ["video_1", "video_2"] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "Videos merged successfully"
    );
    expect(fs.existsSync(response.body.filePath)).toBe(true);
  }, 20000);

  it("should return 400 if less than two titles are provided", async () => {
    const response = await request(app)
      .post("/api/videos/merge")
      .send({
        titles: ["video_1"],
      });

    console.log(response.body);
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Provide at least two video titles to merge."
    );
  });

  it("should return 404 for missing video titles", async () => {
    const response = await request(app)
      .post("/api/videos/merge")
      .send({
        titles: ["Sample Video 1", "Non-Existent Video"],
      });

    console.log(response.body);
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      "Some videos not found: Sample Video 1, Non-Existent Video"
    );
  });

  it("should share a video link successfully", async () => {
    const response = await request(app).post("/api/videos/share").send({
        title: "video_1",
        expiryTime: 2,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Video link shared successfully");
    expect(response.body).toHaveProperty("link");
    expect(new Date(response.body.expiryTime)).toBeInstanceOf(Date);
    expect(new Date(response.body.expiryTime).getTime()).toBeGreaterThan(Date.now());
});

it("should return 404 if video not found", async () => {
    Video.findOne = jest.fn().mockResolvedValue(null);

    const response = await request(app).post("/api/videos/share").send({
        title: "Nonexistent Video",
        expiryTime: 1,
    });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Video not found.");
});

it("should return 500 on unexpected error", async () => {
    jest.spyOn(Video, "findOne").mockImplementationOnce(() => {
        throw new Error("Database error");
    });

    const response = await request(app).post("/api/videos/share").send({
        title: "video_1",
        expiryTime: 1,
    });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Error sharing video");
});

it("should return 403 if the link has expired", async () => {
    const videoTitle = "video_1";
    const video = {
        id: 1,
        title: videoTitle,
        expiryTime: new Date(Date.now() - 10000),
        filePath: "F:/videoverse/uploads/video_1.mp4",
    };

    Video.findByPk = jest.fn().mockResolvedValue(video);
    existsSyncSpy.mockReturnValue(true);

    const response = await request(app).get(`/api/videos/${video.id}/play`);
    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Link has expired.");
});

it("should return 404 if the video file is not found", async () => {
    const videoTitle = "video 111";
    const video = {
        id: 2,
        title: videoTitle,
        expiryTime: null,
        filePath: "path/to/video.mp4",
    };

    Video.findByPk = jest.fn().mockResolvedValue(video);
    existsSyncSpy.mockReturnValue(false);

    const response = await request(app).get(`/api/videos/${video.id}/play`);
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("File not found.");
});
});
