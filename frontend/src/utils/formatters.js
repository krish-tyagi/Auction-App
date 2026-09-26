export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatTimeRemaining(targetDate) {
  if (!targetDate) return { text: '00:00:00', isExpired: true, totalSeconds: 0 };
  
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) {
    return { text: 'Ended', isExpired: true, totalSeconds: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const pad = (n) => String(n).padStart(2, '0');

  let text = '';
  if (days > 0) {
    text = `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  } else {
    text = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return {
    text,
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    totalSeconds: Math.floor(diff / 1000),
  };
}

export function getStatusBadge(status, startTime, endTime) {
  const now = new Date();
  const start = startTime ? new Date(startTime) : null;
  const end = endTime ? new Date(endTime) : null;

  if (status === 'ended' || (end && now >= end)) {
    return { label: 'Ended', color: 'badge-ended', dotClass: 'dot-ended' };
  }
  if (status === 'active' || (start && now >= start && end && now < end)) {
    return { label: 'Live Now', color: 'badge-live', dotClass: 'dot-live' };
  }
  return { label: 'Upcoming', color: 'badge-upcoming', dotClass: 'dot-upcoming' };
}
