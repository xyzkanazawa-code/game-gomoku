import { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import type { PeerMessage } from '../types/game';

export interface UsePeerConnectionProps {
  onMessage: (message: PeerMessage) => void;
  onConnected?: (isHost: boolean) => void;
  onDisconnected?: () => void;
}

export const usePeerConnection = ({
  onMessage,
  onConnected,
  onDisconnected,
}: UsePeerConnectionProps) => {
  const [peerId, setPeerId] = useState<string>('');
  const [targetPeerId, setTargetPeerId] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('未接続');
  const [errorText, setErrorText] = useState<string>('');

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);

  // コネクションのイベントリスナー設定
  const setupConnection = useCallback(
    (conn: DataConnection, hostStatus: boolean) => {
      connRef.current = conn;

      conn.on('open', () => {
        setIsConnected(true);
        setIsHost(hostStatus);
        setStatusText('対戦相手と接続しました！');
        setErrorText('');
        if (onConnected) onConnected(hostStatus);
      });

      conn.on('data', (data: any) => {
        onMessage(data as PeerMessage);
      });

      conn.on('close', () => {
        setIsConnected(false);
        setStatusText('相手との接続が切断されました');
        if (onDisconnected) onDisconnected();
      });

      conn.on('error', (err) => {
        console.error('Connection error:', err);
        setErrorText('通信エラーが発生しました');
      });
    },
    [onMessage, onConnected, onDisconnected]
  );

  // Peerインスタンスの初期化
  const initPeer = useCallback(() => {
    if (peerRef.current) return;

    // 衝突を避けるためのランダムプレフィックス + 短縮ID
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const id = `gomoku-${randomSuffix}`;

    const peer = new Peer(id, {
      debug: 1,
    });

    peer.on('open', (assignedId) => {
      setPeerId(assignedId);
      setStatusText('待機中（相手の参加を待っています）');
    });

    // 相手からの接続要求を受け取る（ホスト側）
    peer.on('connection', (conn) => {
      setupConnection(conn, true);
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      setErrorText(`接続エラー: ${err.type}`);
    });

    peerRef.current = peer;
  }, [setupConnection]);

  // ホストとして部屋を開設
  const createRoom = useCallback(() => {
    if (!peerRef.current) {
      initPeer();
    }
    setIsHost(true);
  }, [initPeer]);

  // ゲストとして部屋に参加
  const joinRoom = useCallback(
    (remoteId: string) => {
      if (!remoteId.trim()) return;

      const trimmedId = remoteId.trim();
      setTargetPeerId(trimmedId);

      const performConnect = (peerInstance: Peer) => {
        setStatusText('相手の部屋に接続中...');
        setErrorText('');
        const conn = peerInstance.connect(trimmedId, { reliable: true });
        setupConnection(conn, false);
      };

      if (!peerRef.current) {
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const id = `gomoku-${randomSuffix}`;
        const peer = new Peer(id, { debug: 1 });

        peer.on('open', (assignedId) => {
          setPeerId(assignedId);
          performConnect(peer);
        });

        peer.on('connection', (conn) => {
          setupConnection(conn, false);
        });

        peer.on('error', (err) => {
          console.error('Peer error:', err);
          setErrorText('ルームが見つからないか接続に失敗しました');
        });

        peerRef.current = peer;
      } else {
        performConnect(peerRef.current);
      }
    },
    [setupConnection]
  );

  // メッセージ送信
  const sendMessage = useCallback((msg: PeerMessage) => {
    if (connRef.current && connRef.current.open) {
      connRef.current.send(msg);
    }
  }, []);

  // 切断・破棄
  const disconnect = useCallback(() => {
    if (connRef.current) {
      connRef.current.close();
      connRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setIsConnected(false);
    setPeerId('');
    setStatusText('未接続');
  }, []);

  useEffect(() => {
    return () => {
      if (connRef.current) connRef.current.close();
      if (peerRef.current) peerRef.current.destroy();
    };
  }, []);

  return {
    peerId,
    targetPeerId,
    setTargetPeerId,
    isConnected,
    isHost,
    statusText,
    errorText,
    createRoom,
    joinRoom,
    sendMessage,
    disconnect,
  };
};
