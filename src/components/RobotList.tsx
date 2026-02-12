interface Robot {
  uid: string;
  name: string;
  board: string;
  is_active: boolean;
  last_seen: string | null;
  battery: string | null;
  robot_state: any;
}

interface Props {
  robots: Robot[];
  selectedRobot: string | null;
  onSelectRobot: (uid: string) => void;
}

export default function RobotList({ robots, selectedRobot, onSelectRobot }: Props) {
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const getBatteryLevel = (battery: string | null): number => {
    if (!battery) return 0;
    return Math.round(parseFloat(battery) * 100);
  };

  const getStatusColor = (robotState: any): string => {
    if (!robotState || !robotState.status) return 'gray';
    switch (robotState.status) {
      case 'OK': return 'green';
      case 'WARNING': return 'yellow';
      case 'ERROR': return 'red';
      case 'STALE': return 'orange';
      default: return 'gray';
    }
  };

  return (
    <div className="robot-list">
      <h3>Fleet ({robots.length} robots)</h3>
      <div className="list-container">
        {robots.map(robot => (
          <div
            key={robot.uid}
            className={`robot-card ${selectedRobot === robot.uid ? 'selected' : ''}`}
            onClick={() => onSelectRobot(robot.uid)}
          >
            <div className="robot-header">
              <span className="robot-icon">🦈</span>
              <div className="robot-info">
                <div className="robot-name">{robot.name}</div>
                <div className="robot-uid">{robot.uid}</div>
              </div>
              <div className={`status-indicator ${getStatusColor(robot.robot_state)}`}></div>
            </div>
            <div className="robot-details">
              <div className="detail-row">
                <span>Board:</span>
                <span className="board-type">{robot.board}</span>
              </div>
              <div className="detail-row">
                <span>Battery:</span>
                <span className="battery">{getBatteryLevel(robot.battery)}%</span>
              </div>
              <div className="detail-row">
                <span>Last seen:</span>
                <span className="last-seen">{formatTime(robot.last_seen)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
