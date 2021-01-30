import React, { useEffect, useState } from "react";
import { Form, Input, Button, notification } from "antd";
import { DingtalkOutlined } from "@ant-design/icons";
import { signup } from "../util/ApiUtil";
import "./Signup.css";

const Signup = (props) => {
  const [loading, setLoading] = useState(false);
  const [ppUrl, setppUrl] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("accessToken") !== null) {
      props.history.push("/");
    }
  }, []);

  const onFinish = (values) => {
    debugger
    setLoading(true);
    values.profilePicUrl = ppUrl
    signup(values)
      .then((response) => {
        notification.success({
          message: "Success",
          description:
            "Thank you! You're successfully registered. Please Login to continue!",
        });
        props.history.push("/login");
        setLoading(false);
      })
      .catch((error) => {
        notification.error({
          message: "Error",
          description:
            error.message || "Sorry! Something went wrong. Please try again!",
        });
        setLoading(false);
      });
  };

  function onFileChangeHandler(e){
    e.preventDefault();
    var formdata = new FormData();
    formdata.append("file", e.target.files[0], "pp123.jpg");

    var requestOptions = {
      method: 'POST',
      body: formdata,
      redirect: 'follow'
    };

    fetch("http://207.154.208.203:3001/FileService/uploadFile/profil", requestOptions)
    .then(response => response.text())
    .then(result => {
      debugger
      console.log(result)
      setppUrl(result)
    })
    .catch(error => console.log('error', error));
  }
  return (
    <div className="login-container">
      <DingtalkOutlined style={{ fontSize: 50 }} />
      <Form
        name="normal_login"
        className="login-form"
        initialValues={{ remember: true }}
        onFinish={onFinish}
      >
        <Form.Item
          name="name"
          rules={[{ required: true, message: "Please input your name!" }]}
        >
          <Input size="large" placeholder="Name" />
        </Form.Item>
        <Form.Item
          name="username"
          rules={[{ required: true, message: "Please input your Username!" }]}
        >
          <Input size="large" placeholder="Username" />
        </Form.Item>
        <Form.Item
          name="email"
          rules={[{ required: true, message: "Please input your email!" }]}
        >
          <Input size="large" placeholder="Email" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: "Please input your Password!" }]}
        >
          <Input size="large" type="password" placeholder="Password" />
        </Form.Item>
        <Form.Item
          name="profilePicUrl"
          rules={[
            {
              required: true,
              message: "Please input your profile picture URL!",
            },
          ]}
        >
          {/* <Input size="large" placeholder="Profile picture url" /> */}
          <input type="file" className="form-control" name="file" onChange={onFileChangeHandler}/>
        </Form.Item>

        <Form.Item>
          <Button
            shape="round"
            size="large"
            htmlType="submit"
            className="login-form-button"
            loading={loading}
          >
            Signup
          </Button>
        </Form.Item>
        Already a member? <a href="/login">Log in</a>
      </Form>
    </div>
  );
};

export default Signup;
