import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';
import { approveInstructorApplication, fetchPendingInstructorApplications } from '../services/userService';
import { Button } from './Button';

export const AdminDashboard: React.FC = () => {
  const { role, user } = useAuth();
  const [applications, setApplications] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const isAdmin = role === 'admin';

  const loadApplications = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    const pending = await fetchPendingInstructorApplications();
    setApplications(pending);
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      void loadApplications();
    }
  }, [isAdmin, loadApplications]);

  const handleApprove = async (targetUid: string) => {
    if (!user) return;
    setActionId(targetUid);
    try {
      await approveInstructorApplication(targetUid, user.uid, user.displayName || user.email || '관리자');
      await loadApplications();
    } finally {
      setActionId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-gray-500">
        관리자만 접근할 수 있는 영역입니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-ocean-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">강사 신청 관리</h2>
        <p className="text-sm text-gray-500">대기 중인 신청을 검토하고 승인할 수 있습니다.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {loading ? (
          <p className="text-gray-500 text-sm">신청 목록을 불러오는 중입니다...</p>
        ) : applications.length === 0 ? (
          <p className="text-gray-500 text-sm">대기 중인 신청이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const application = app.instructorApplication;
              return (
                <div key={app.uid} className="border border-gray-100 rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{app.displayName || '이름 없음'}</p>
                    <p className="text-sm text-gray-500">{app.email}</p>
                    {application?.notes && (
                      <p className="text-sm text-gray-600 mt-1">메모: {application.notes}</p>
                    )}
                    {application?.submittedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        신청일: {new Date(application.submittedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 md:items-end">
                    {application?.certificateUrl && (
                      <a
                        href={application.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-ocean-600 hover:text-ocean-800 underline"
                      >
                        증빙 자료 보기
                      </a>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleApprove(app.uid)}
                      isLoading={actionId === app.uid}
                    >
                      강사 승인
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

