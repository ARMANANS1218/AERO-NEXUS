import {
  format,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  differenceInYears,
  isValid
} from 'date-fns';

const renderTime = (dateStr) => {
  if (!dateStr) return '--:--';

  const date = new Date(dateStr);
  if (!isValid(date)) return '--:--';

  const now = new Date();
  const secondsAgo = differenceInSeconds(now, date);
  const minutesAgo = differenceInMinutes(now, date);
  const hoursAgo = differenceInHours(now, date);
  const daysAgo = differenceInDays(now, date);
  const yearsAgo = differenceInYears(now, date);

  if (secondsAgo < 10) {
    return 'just now';
  } else if (minutesAgo < 60) {
    return format(date, 'mm:ss a'); // e.g., 05:23 PM
  } else if (hoursAgo < 24) {
    return format(date, 'hh:mm a'); // e.g., 03:45 PM
  } else if (daysAgo < 365) {
    return format(date, 'hh:mm a'); // e.g., 19 Jul 03:45 PM
  } else {
    return format(date, 'dd MMM yyyy hh:mm a'); // e.g., 21 Jul 2023 03:45 PM
  }
};

export default renderTime;
