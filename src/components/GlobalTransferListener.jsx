import React, { useEffect, useState } from 'react';
import { useAcceptQueryMutation } from '../features/query/queryApi';
import ConfirmDialog from './ConfirmDialog';
import useNotificationSound from '../hooks/useNotificationSound';
import { getQuerySocket } from '../socket/querySocket';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {jwtDecode }from 'jwt-decode';

export default function GlobalTransferListener() {
  const [open, setOpen] = useState(false);
  const [petitionId, setPetitionId] = useState(null);
  const [payload, setPayload] = useState(null);
  const { play } = useNotificationSound();
  const [acceptQuery, { isLoading }] = useAcceptQueryMutation();
  const navigate = useNavigate();

  useEffect(() => {
    const socket = getQuerySocket();
    const onTransferRequest = (p) => {
      // Targeted room event, always for current user
      setPetitionId(p?.petitionId);
      setPayload(p);
      setOpen(true);
      play();
      // Debug
      console.debug('[transfer-request] received', p);
    };
    const onTransferRequestedBroadcast = (p) => {
      // Fallback: broadcast event, filter by token user id
      try {
        const token = localStorage.getItem('token');
        const decoded = token ? jwtDecode(token) : null;
        const me = decoded?.id || decoded?._id;
        if (p?.to?.id && me && String(p.to.id) === String(me)) {
          setPetitionId(p?.petitionId);
          setPayload(p);
          setOpen(true);
          play();
          console.debug('[query-transfer-requested] broadcast matched current user', p);
        }
      } catch {}
    };
    socket.on('transfer-request', onTransferRequest);
    socket.on('query-transfer-requested', onTransferRequestedBroadcast);
    return () => {
      socket.off('transfer-request', onTransferRequest);
      socket.off('query-transfer-requested', onTransferRequestedBroadcast);
    };
  }, [play]);

  if (!open) return null;

  const onConfirm = async () => {
    try {
      await acceptQuery(petitionId).unwrap();
      toast.success('Query accepted successfully! Opening query...');
      play();

      // clear modal state
      setOpen(false);
      setPetitionId(null);
      setPayload(null);

      // Derive role from JWT to navigate to the correct route
      let role = 'agent';
      try {
        const token = localStorage.getItem('token');
        const decoded = token ? jwtDecode(token) : null;
        role = (decoded?.role || 'agent').toLowerCase();
      } catch (e) {
        // ignore and default to agent
      }

      // Wait briefly to allow backend to complete processing, then open the accepted query
      setTimeout(() => {
        const rolePath = role;
        if (['qa','tl','agent'].includes(role)) {
          navigate(`/${rolePath}/query/${petitionId}`);
        } else {
          // fallback for unexpected roles
          navigate(`/agent/query/${petitionId}`);
        }
      }, 700);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to accept query');
    }
  };

  const onCancel = () => {
    if (isLoading) return;
    setOpen(false);
    setPetitionId(null);
    setPayload(null);
  };

  return (
    <ConfirmDialog
      open={open}
      title="Transfer request"
      message={`You have a transfer request for petition ${petitionId}${payload?.from?.name ? ` from ${payload.from.name}` : ''}${payload?.reason ? `.\nReason: ${payload.reason}` : '.'} Accept to take ownership or ignore to decline.`}
      confirmText="Accept"
      cancelText="Ignore"
      loading={isLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
