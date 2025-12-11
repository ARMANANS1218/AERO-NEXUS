import { Stack, TextField, IconButton } from "@mui/material";
import { Send } from "@mui/icons-material";

export default function MessageInput({ text, setText, onSend, onTyping }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        m: 1,
        px: 2,
        background: "#fff",
        borderRadius: "50px",
        borderTop: "1px solid  #eee"
      }}
      spacing={1}
    >
      <TextField
        fullWidth
        size="small"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onTyping(e.target.value);
        }}
        placeholder="Type your message"
      />
      <IconButton onClick={onSend} disabled={!text.trim()}>
        <Send />
      </IconButton>
    </Stack>
  );
}
