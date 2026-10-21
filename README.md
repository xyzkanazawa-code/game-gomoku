# 五目並べ Online (Gomoku Online)

ブラウザで誰でも完全無料・登録不要で遊べる五目並べ（Gomoku）Webアプリケーションです。

## 主な特徴
- **WebRTC (PeerJS) オンラインP2P対戦**: 専用サーバー代0円。部屋を作成して発行されたURLを共有するだけで、ブラウザ同士が直接つながり低遅延でリアルタイム対戦できます。
- **CPU対戦**: 初級・中級・上級の3段階の思考AI（評価関数・攻防スコアリング）を搭載。
- **ローカル2人対戦**: 1台のPCやスマートフォンで対面対戦が可能。
- **リアルな打石音と演出**: Web Audio APIにより外部音源不要で生成される心地よい「パチッ」という着手音と、勝利時の紙吹雪演出。
- **充実のアシスト機能**: 待った、投了、リセット、直前手のハイライト、対戦チャット・スタンプ機能。

## 開発環境とビルド

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# 本番用ビルド (dist/ へ静的ファイル生成)
npm run build

# ローカルプレビュー
npm run preview
```

## GitHub Pagesへのデプロイ
1. GitHubで新規リポジトリを作成します。
2. リモートを追加してプッシュします：
   ```bash
   git remote add origin https://github.com/<あなたのユーザー名>/game-gomoku.git
   git push -u origin main
   ```
3. GitHubリポジトリの「Settings」→「Pages」で「GitHub Actions」を選択すると、自動でビルド＆公開されます。
