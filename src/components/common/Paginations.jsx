import React from 'react';
import {
  Grid, Stack, Typography, Select, MenuItem, Pagination
} from '@mui/material';

const Paginations = ({
  rowsPerPage,
  setRowsPerPage,
  page,
  setPage,
  totalPages,
  rowsOptions = [5, 10, 15],
}) => {
  return (
    <Grid container justifyContent="center" alignItems="center" mt={2}>
      <Grid size={{xs:12,lg:6,sm:6,md:6}}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2">Rows per page:</Typography>
          <Select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(1);
            }}
            size="small"
          >
            {rowsOptions.map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </Select>
          <Typography variant="body2" color="textSecondary">
            Page {page} of {totalPages}
          </Typography>
        </Stack>
      </Grid>
      <Grid size={{xs:12,lg:6,sm:6,md:6}}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, value) => setPage(value)}
          color="primary"
          shape="rounded"
        />
      </Grid>
    </Grid>
  );
};

export default Paginations;
