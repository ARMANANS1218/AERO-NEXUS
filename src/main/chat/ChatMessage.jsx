import { Avatar, Box, IconButton, Stack, Typography } from "@mui/material";
import renderTime from "../../utils/renderTime";

// import ChatReply from "../../components/common/public/ChatReply";

const ChatMessage = ({ msg, selectedUser }) => {
    // console.log("msg", msg?.from);
    const isFrom = msg?.from === selectedUser?._id;
    const isTo = msg?.to === selectedUser?._id;
    // console.log("isFrom", selectedUser?._id, isFrom);
    return (
      <Box mb={1} display="flex" justifyContent={isFrom ? "flex-start" : "flex-end"}>
        <Stack direction="row" sx={{ flexDirection: isFrom ? "row" : "row-reverse" }}>
          <Box
              sx={{
                mt: 0.2,
                backgroundColor: isFrom ? "#d9efc1ff" : "#cbe2ddff",
                p: 0.5,
                px: 2,
                borderRadius: 2,
                maxWidth: 300
              }}
            >
            <Stack direction={'row'} spacing={1} alignItems={'center'}>
              <Typography variant="body1">{msg?.message}</Typography>
              <Typography>{msg?.message?.replies?.message}</Typography>
              {/* <Box>
                <IconButton sx={{ height: '20px', width: '20px' }} size="small"><ChatReply /></IconButton>
              </Box> */}
            </Stack>
            <Typography variant="body2" sx={{ fontSize: "8px", ml: 1 }}>
              {renderTime(msg?.createdAt)}
            </Typography>
          </Box>
        </Stack>
      </Box>
    );
  };

  export default ChatMessage;