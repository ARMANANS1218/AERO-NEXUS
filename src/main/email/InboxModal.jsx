import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Grid, Typography, IconButton, Stack, Divider
} from "@mui/material";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import { useFormik } from "formik";

const defaultValues = {
  username: "",
  email: "",
  mobile: "",
  employeeId: "",
  profileImage: null,
};

const FormField = ({ formik, name, label }) => (
  <TextField
    name={name}
    label={label}
    fullWidth
    size="small"
    value={formik.values[name]}
    onChange={formik.handleChange}
    onBlur={formik.handleBlur}
    error={formik.touched[name] && Boolean(formik.errors[name])}
    helperText={formik.touched[name] && formik.errors[name]}
  />
);

const InboxModal = ({ open, handleClose, initialValues, onSubmit }) => {
  const [previewImage, setPreviewImage] = useState("");

  const formik = useFormik({
    initialValues: initialValues || defaultValues,
    validate: (values) => {
      const errors = {};
      if (!values.username) errors.username = "Required";
      if (!values.email) errors.email = "Required";
      if (!values.mobile) errors.mobile = "Required";
      if (!values.employeeId) errors.employeeId = "Required";
      return errors;
    },
    onSubmit: (values) => {
      const newAgent = {
        ...values,
        id: initialValues?.id || Date.now(),
        activeSince: new Date().toISOString(),
        status: "Active",
        onBreak: false,
        profileImage: previewImage,
      };
      onSubmit(newAgent);
      formik.resetForm();
      setPreviewImage("");
      handleClose();
    },
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      formik.setFieldValue("profileImage", file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    if (initialValues?.profileImage && !previewImage) {
      setPreviewImage(initialValues.profileImage);
    }
  }, [initialValues, previewImage]);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <Box>
        <DialogTitle>{initialValues?.id ? "Edit Agent" : "Create Agent"}</DialogTitle>
        <Divider />
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Stack spacing={3}>
              {/* Profile Image Upload */}
              <Box textAlign="center">
                <Box
                  sx={{
                    width: 100, height: 100, borderRadius: "50%",
                    backgroundColor: "#F1F2F5",
                    backgroundImage: previewImage ? `url(${previewImage})` : "none",
                    backgroundSize: "cover", backgroundPosition: "center",
                    mx: "auto", position: "relative",
                  }}
                >
                  <IconButton component="label" sx={{
                    position: "absolute", bottom: -8, right: -8,
                    backgroundColor: "#fff", border: "1px solid #ccc"
                  }}>
                    <AddAPhotoIcon />
                    <input hidden accept="image/*" type="file" onChange={handleImageChange} />
                  </IconButton>
                </Box>
              </Box>

              {/* Form Fields */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormField formik={formik} name="username" label="Name" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormField formik={formik} name="email" label="Email" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormField formik={formik} name="mobile" label="Mobile" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormField formik={formik} name="employeeId" label="Employee ID" />
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleClose} color="error">Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {initialValues?.id ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Box>
    </Dialog>
  );
};

export default InboxModal;
