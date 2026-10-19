const Docker = require('dockerode');
const os = require('os');

const isWin = os.platform() === 'win32';
const docker = isWin
  ? new Docker({ socketPath: '\\\\.\\pipe\\docker_engine' })
  : new Docker({ socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock' });

async function listContainers(all = true) {
  const containers = await docker.listContainers({ all });
  return containers.map((c) => ({
    id: c.Id,
    names: c.Names.map((n) => n.replace(/^\//, '')),
    image: c.Image,
    imageId: c.ImageID,
    state: c.State,
    status: c.Status,
    created: c.Created,
    ports: (c.Ports || []).map((p) => ({
      private: p.PrivatePort,
      public: p.PublicPort,
      type: p.Type,
      ip: p.IP,
    })),
    labels: c.Labels,
    mounts: c.Mounts,
    network: c.NetworkSettings?.Networks,
  }));
}

async function inspectContainer(id) {
  const container = docker.getContainer(id);
  const info = await container.inspect();
  return {
    id: info.Id,
    name: info.Name?.replace(/^\//, ''),
    image: info.Config?.Image,
    state: info.State?.Status,
    running: info.State?.Running,
    exitCode: info.State?.ExitCode,
    startedAt: info.State?.StartedAt,
    finishedAt: info.State?.FinishedAt,
    restartCount: info.RestartCount,
    created: info.Created,
    ports: info.NetworkSettings?.Ports,
    env: info.Config?.Env,
    cmd: info.Config?.Cmd,
    entrypoint: info.Config?.Entrypoint,
    mounts: info.Mounts,
    networkMode: info.HostConfig?.NetworkMode,
    privileged: info.HostConfig?.Privileged,
    restartPolicy: info.HostConfig?.RestartPolicy,
    logPath: info.LogPath,
  };
}

async function startContainer(id) {
  await docker.getContainer(id).start();
  return { success: true };
}

async function stopContainer(id, t = 10) {
  await docker.getContainer(id).stop({ t });
  return { success: true };
}

async function restartContainer(id, t = 10) {
  await docker.getContainer(id).restart({ t });
  return { success: true };
}

async function pauseContainer(id) {
  await docker.getContainer(id).pause();
  return { success: true };
}

async function unpauseContainer(id) {
  await docker.getContainer(id).unpause();
  return { success: true };
}

async function removeContainer(id, force = false) {
  await docker.getContainer(id).remove({ force });
  return { success: true };
}

async function createContainer(opts) {
  const container = await docker.createContainer(opts);
  return { id: container.id };
}

async function getContainerStats(id) {
  const stats = await docker.getContainer(id).stats({ stream: false });
  const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  const cpuCount = stats.cpu_stats.online_cpus || 1;
  const cpuPercent = systemDelta > 0 ? ((cpuDelta / systemDelta) * cpuCount) * 100 : 0;
  const memUsage = stats.memory_stats.usage || 0;
  const memLimit = stats.memory_stats.limit || 0;
  return {
    cpuPercent: Math.round(cpuPercent * 100) / 100,
    memUsage,
    memLimit,
    memPercent: memLimit > 0 ? Math.round((memUsage / memLimit) * 10000) / 100 : 0,
    netRx: stats.networks ? Object.values(stats.networks).reduce((a, n) => a + n.rx_bytes, 0) : 0,
    netTx: stats.networks ? Object.values(stats.networks).reduce((a, n) => a + n.tx_bytes, 0) : 0,
    blockRead: stats.blkio_stats?.io_service_bytes_recursive?.find((b) => b.op === 'Read')?.value || 0,
    blockWrite: stats.blkio_stats?.io_service_bytes_recursive?.find((b) => b.op === 'Write')?.value || 0,
  };
}

async function listImages() {
  const images = await docker.listImages({ all: false });
  return images.map((img) => ({
    id: img.Id,
    tags: img.RepoTags || ['<none>'],
    size: img.Size,
    created: img.Created,
    virtualSize: img.VirtualSize,
    layers: img.Layers,
  }));
}

async function removeImage(id, force = false) {
  await docker.getImage(id).remove({ force });
  return { success: true };
}

async function pullImage(tag) {
  return new Promise((resolve, reject) => {
    docker.pull(tag, (err, stream) => {
      if (err) return reject(err);
      docker.modem.followProgress(stream, (err2) => {
        if (err2) return reject(err2);
        resolve({ success: true });
      });
    });
  });
}

async function listNetworks() {
  const networks = await docker.listNetworks();
  return networks.map((n) => ({
    id: n.Id,
    name: n.Name,
    driver: n.Driver,
    scope: n.Scope,
    internal: n.Internal,
    containers: n.Containers || {},
    created: n.Created,
    ipam: n.IPAM,
  }));
}

async function createNetwork(opts) {
  const net = await docker.createNetwork(opts);
  return { id: net.id };
}

async function removeNetwork(id) {
  await docker.getNetwork(id).remove();
  return { success: true };
}

async function listVolumes() {
  const { Volumes } = await docker.listVolumes();
  return (Volumes || []).map((v) => ({
    name: v.Name,
    driver: v.Driver,
    mountpoint: v.Mountpoint,
    created: v.CreatedAt,
    labels: v.Labels,
    scope: v.Scope,
    usageData: v.UsageData,
  }));
}

async function createVolume(opts) {
  const vol = await docker.createVolume(opts);
  return { name: vol.name };
}

async function removeVolume(name, force = false) {
  await docker.getVolume(name).remove({ force });
  return { success: true };
}

async function getSystemInfo() {
  const info = await docker.info();
  return {
    name: info.Name,
    operatingSystem: info.OperatingSystem,
    os: info.OSType,
    architecture: info.Architecture,
    ncpus: info.NCPU,
    memTotal: info.MemTotal,
    dockerVersion: info.ServerVersion,
    containers: info.Containers,
    containersRunning: info.ContainersRunning,
    containersStopped: info.ContainersStopped,
    images: info.Images,
    driver: info.Driver,
    kernelVersion: info.KernelVersion,
    host: info.Hostname,
  };
}

async function getSystemDf() {
  const df = await docker.df();
  return {
    images: df.Images?.map((i) => ({ id: i.Id, size: i.Size, shared: i.SharedSize, unique: i.UniqueSize, containers: i.Containers })) || [],
    containers: df.Containers?.map((c) => ({ id: c.Id, image: c.Image, size: c.Size, created: c.Created })) || [],
    volumes: df.Volumes?.map((v) => ({ name: v.Name, size: v.UsageData?.Size, refCount: v.UsageData?.RefCount })) || [],
    buildCache: df.BuildCache?.length || 0,
  };
}

function streamContainerLogs(id, opts = {}) {
  const container = docker.getContainer(id);
  return container.logs({
    follow: opts.follow ?? true,
    stdout: true,
    stderr: true,
    tail: opts.tail ?? 100,
    timestamps: opts.timestamps ?? false,
  });
}

function streamStats(id) {
  const container = docker.getContainer(id);
  return container.stats({ stream: true });
}

async function systemPrune() {
  const result = await docker.pruneContainers();
  const images = await docker.pruneImages();
  const networks = await docker.pruneNetworks();
  const volumes = await docker.pruneVolumes();
  return { containers: result, images, networks, volumes };
}

module.exports = {
  docker,
  listContainers,
  inspectContainer,
  startContainer,
  stopContainer,
  restartContainer,
  pauseContainer,
  unpauseContainer,
  removeContainer,
  createContainer,
  getContainerStats,
  listImages,
  removeImage,
  pullImage,
  listNetworks,
  createNetwork,
  removeNetwork,
  listVolumes,
  createVolume,
  removeVolume,
  getSystemInfo,
  getSystemDf,
  streamContainerLogs,
  streamStats,
  systemPrune,
};
