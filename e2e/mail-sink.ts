import net from "node:net";

export type Mail = { to: string; subject: string; body: string };

/** Minimal SMTP server that records messages in memory, so tests can assert on real delivery. */
export function startMailSink(port: number) {
  const mails: Mail[] = [];
  const server = net.createServer((socket) => {
    let inData = false;
    let data = "";
    let rcpt = "";
    socket.write("220 sink ESMTP\r\n");
    socket.on("data", (chunk) => {
      for (const line of chunk.toString().split("\r\n")) {
        if (inData) {
          if (line === ".") {
            inData = false;
            const subject = /^Subject: (.*)$/m.exec(data)?.[1] ?? "";
            mails.push({ to: rcpt, subject, body: data });
            data = "";
            socket.write("250 queued\r\n");
          } else data += line + "\n";
          continue;
        }
        const u = line.toUpperCase();
        if (u.startsWith("EHLO") || u.startsWith("HELO")) socket.write("250 sink\r\n");
        else if (u.startsWith("RCPT TO:")) {
          rcpt = /<([^>]+)>/.exec(line)?.[1] ?? "";
          socket.write("250 ok\r\n");
        } else if (u === "DATA") {
          inData = true;
          socket.write("354 go\r\n");
        } else if (u === "QUIT") {
          socket.write("221 bye\r\n");
          socket.end();
        } else if (line) socket.write("250 ok\r\n");
      }
    });
  });
  return new Promise<{ mails: Mail[]; close: () => Promise<void> }>((resolve) => {
    server.listen(port, "127.0.0.1", () =>
      resolve({ mails, close: () => new Promise((r) => server.close(() => r())) }),
    );
  });
}
