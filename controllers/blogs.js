const blogsRouter = require("express").Router();
const Blog = require("../models/blogs");
const User = require("../models/users");
const jwt = require("jsonwebtoken");

const getTokenFrom = (request) => {
  const authorization = request.get("authorization");
  console.log(authorization);
  if (authorization && authorization.startsWith("Bearer ")) {
    return authorization.replace("Bearer ", "");
  }
  return null;
};

blogsRouter.get("/", async (request, response) => {
  // const blogs = await Blog.find({}).populate("user");
  const blogs = await Blog.find({});
  response.json(blogs);
});

blogsRouter.get("/:id", async (request, response) => {
  const blog = await Blog.findById(request.params.id).populate("user");
  if (blog) {
    response.json(blog);
  } else {
    response.status(404).send({ error: "Wrong ID" });
  }
});

blogsRouter.post("/", async (request, response) => {
  const body = request.body;

  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET);
  if (!decodedToken.id) {
    return response.status(401).json({ error: "token invalid" });
  }
  const user = await User.findById(decodedToken.id);

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes ? body.likes : 0,
    user: user.id,
  });

  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();
  response.json(savedBlog);
});

blogsRouter.delete("/:id", async (request, response) => {
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET);
  const blog = await Blog.findById(request.params.id);
  if (!decodedToken.id) {
    return response.status(401).json({ error: "Token invalid" });
  } else if (!(blog.user.toString() === decodedToken.id.toString())) {
    return response.status(401).json({ error: "You are not allow to do this" });
  }
  await Blog.findByIdAndRemove(request.params.id);

  response.status(201).send("Blog succesfully deleted");
});

blogsRouter.put("/:id", async (request, response) => {
  const body = request.body;
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET);
  // const blog = await Blog.findById(request.params.id);
  if (!decodedToken.id) {
    return response.status(401).json({ error: "Token invalid" });
  }
  // } else if (!(blog.user.toString() === decodedToken.id.toString())) {
  //   return response.status(401).json({ error: "You are not allow to do this" });
  // }
  const blog = {
    user: body.user.id,
    likes: body.likes,
    author: body.author,
    title: body.title,
    url: body.url,
  };

  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
    new: true,
  });
  return response.json(updatedBlog);
});

module.exports = blogsRouter;
