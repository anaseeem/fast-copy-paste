import React, { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

type MyProgressProps = {
  progress: number;
};

const MyProgress: React.FC<MyProgressProps> = ({ progress }) => {
  return (
    <div className="py-1">
      <Progress
        value={progress}
        className=""
      />
    </div>
  );
};

export default MyProgress;
