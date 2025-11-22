import React, { useState } from 'react';
import { Badge, InstructorApplication, UserProfile, UserRole } from '../types';
import { BadgeCollection } from './BadgeCollection';
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';

interface MyPageProps {
  profile: UserProfile | null;
  unlockedBadges: Badge[];
  onBadgeCreated?: () => void | Promise<void>;
}

const roleStyles: Record<UserRole, { label: string; className: string }> = {
  admin: { label: 'Admin', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  diver: { label: 'Diver', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  instructor: { label: 'Instructor', className: 'bg-amber-100 text-amber-700 border-amber-200' },
};

const renderApplicationStatus = (application?: InstructorApplication) => {
  if (!application || application.status === 'none') {
    return (
      <p className="text-sm text-gray-500">
        아직 강사 인증을 신청하지 않았습니다.
      </p>
    );
  }

  if (application.status === 'pending') {
    return (
      <div className="text-sm text-blue-600 bg-blue-50 border border-blue-100 rounded-lg p-3">
        강사 인증 심사 중입니다. (제출일: {application.submittedAt && new Date(application.submittedAt).toLocaleDateString()})
      </div>
    );
  }

  if (application.status === 'approved') {
    return (
      <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
        강사 인증이 승인되었습니다! (승인일: {application.reviewedAt && new Date(application.reviewedAt).toLocaleDateString()})
      </div>
    );
  }

  return (
    <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
      강사 인증이 반려되었습니다. 다시 신청할 수 있습니다.
    </div>
  );
};

export const MyPage: React.FC<MyPageProps> = ({ profile, unlockedBadges, onBadgeCreated }) => {
  const { applyForInstructor, role, updateAccountInfo } = useAuth();
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState(profile?.displayName || '');
  const [bioInput, setBioInput] = useState(profile?.bio || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const application = profile?.instructorApplication;
  const canApply =
    role === 'diver' &&
    (application?.status === 'none' || application?.status === 'rejected' || !application);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificateFile) {
      setMessage('자격증 파일을 첨부해주세요.');
      return;
    }
    try {
      setSubmitting(true);
      setMessage(null);
      await applyForInstructor(certificateFile, notes);
      setCertificateFile(null);
      setNotes('');
      setMessage('신청이 접수되었습니다. 관리자 승인 후 강사로 전환됩니다.');
    } catch (error) {
      setMessage('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const badgeInfo = roleStyles[role];

  const handleProfileSave = async () => {
    if (!profile) return;
    try {
      setProfileSaving(true);
      setProfileMessage(null);
      await updateAccountInfo({
        displayName: displayNameInput,
        bio: bioInput,
      });
      setProfileMessage('계정 정보가 저장되었습니다.');
      setIsEditingProfile(false);
    } catch (error: any) {
      setProfileMessage(error?.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="bg-white rounded-xl shadow-sm border border-ocean-100 p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">계정 정보</p>
            <h2 className="text-2xl font-bold text-gray-900">{profile?.displayName || '익명 다이버'}</h2>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${badgeInfo.className}`}>
              {badgeInfo.label}
            </div>
            <Button
              size="sm"
              variant={isEditingProfile ? 'secondary' : 'ghost'}
              onClick={() => setIsEditingProfile((prev) => !prev)}
            >
              {isEditingProfile ? '취소' : '정보 수정'}
            </Button>
          </div>
        </div>

        {isEditingProfile && (
          <div className="grid md:grid-cols-2 gap-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
              <input
                type="text"
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-ocean-500 focus:border-ocean-500"
                maxLength={20}
              />
              <p className="text-xs text-gray-400 mt-1">닉네임 변경 시 중복 확인 후 저장됩니다.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">소개 (선택)</label>
              <textarea
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                rows={3}
                className="w-full border rounded-lg px-3 py-2 focus:ring-ocean-500 focus:border-ocean-500"
                maxLength={120}
              ></textarea>
            </div>
            {profileMessage && (
              <p className="md:col-span-2 text-sm text-blue-600">{profileMessage}</p>
            )}
            <div className="md:col-span-2 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setDisplayNameInput(profile?.displayName || '');
                  setBioInput(profile?.bio || '');
                  setIsEditingProfile(false);
                  setProfileMessage(null);
                }}
                disabled={profileSaving}
              >
                취소
              </Button>
              <Button onClick={handleProfileSave} isLoading={profileSaving} disabled={profileSaving}>
                저장하기
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-ocean-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">강사 인증</h3>
            <p className="text-sm text-gray-500">강사 인증을 신청하면 관리자 검토 후 강사 계정으로 전환됩니다.</p>
          </div>
        </div>

        {renderApplicationStatus(application)}

        {canApply && (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">자격증 파일</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">추가 메모 (선택)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border rounded-md px-3 py-2"
                placeholder="자격증 발급 기관, 번호 등 추가 정보가 있다면 작성해주세요."
              ></textarea>
            </div>
            {message && (
              <p className="text-sm text-gray-600">{message}</p>
            )}
            <Button type="submit" isLoading={submitting} disabled={submitting || !certificateFile}>
              강사 인증 신청하기
            </Button>
          </form>
        )}
      </section>

      <section>
        <BadgeCollection unlockedBadges={unlockedBadges} onBadgeCreated={onBadgeCreated} />
      </section>
    </div>
  );
};

