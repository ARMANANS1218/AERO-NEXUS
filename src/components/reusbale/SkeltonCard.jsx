import { Box, Stack, Skeleton, IconButton } from "@mui/material";
import { Videocam, Send } from "@mui/icons-material";

const shimmerStyle = {
  background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 37%, #f0f0f0 63%)",
  backgroundSize: "400% 100%",
  animation: "shimmer 1.4s ease infinite",
};

const ChatSkeleton = ({ variant = "full" }) => {
  if (variant === "messages") {
    return (
      <Box>
        {[...Array(6)].map((_, i) => (
          <Stack
            key={i}
            direction={i % 2 === 0 ? "row" : "row-reverse"}
            spacing={1}
            mb={2}
          >
            <Skeleton
              variant="circular"
              width={32}
              height={32}
              sx={shimmerStyle}
            />
            <Skeleton
              variant="rectangular"
              width={180}
              height={40}
              sx={{ borderRadius: 2, ...shimmerStyle }}
            />
          </Stack>
        ))}
      </Box>
    );
  }

  // Full Skeleton
  return (
    <Box sx={{ height: "87vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ p: 1}}
      >
        <Stack direction="row" spacing={1} alignItems>
          <Skeleton
            variant="circular"
            width={42}
            height={42}
            sx={shimmerStyle}
          />
         <Box>
            <Skeleton variant="text" width={150} height={40} sx={shimmerStyle} />
            <Skeleton variant="text" width={60} height={20} sx={shimmerStyle} />
          </Box>
        </Stack>
        <IconButton disabled>
          <Skeleton
              variant="circular"
              width={32}
              height={32}
              sx={shimmerStyle}
            />
        </IconButton>
      </Stack>

      {/* Messages */}
      <Box sx={{ flex: 1, p: 2, overflowY: "auto" }}>
        {[...Array(5)].map((_, i) => (
          <Stack
          alignItems={'center'}
            key={i}
            direction={i % 2 === 0 ? "row" : "row-reverse"}
            spacing={1}
            mb={1}
          >
            <Skeleton
              variant="circular"
              width={32}
              height={32}
              sx={shimmerStyle}
            />
             <Box>
            <Skeleton variant="text" width={200} height={40} sx={shimmerStyle} />
            <Skeleton variant="text" width={60} height={20} sx={shimmerStyle} />
          </Box>
          </Stack>
        ))}
      </Box>

      {/* Input */}
      <Stack
        direction="row"
        alignItems="center"
        sx={{
          m: 1,
        }}
        spacing={1}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height={40}
          sx={shimmerStyle}
        />
        <IconButton disabled>
         <Skeleton
              variant="circular"
              width={32}
              height={32}
              sx={shimmerStyle}
            />
        </IconButton>
      </Stack>
    </Box>
  );
};

export default ChatSkeleton;
