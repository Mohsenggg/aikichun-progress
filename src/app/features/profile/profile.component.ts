import {
    Component, EventEmitter, Input, Output, inject, signal,
    OnInit, OnChanges, computed, ElementRef, OnDestroy, AfterViewInit,
    ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { RoadmapService } from '../../core/roadmap/roadmap.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    @Input() isOpen = false;
    @Output() close = new EventEmitter<void>();
    @ViewChild('dialogEl') dialogEl!: ElementRef<HTMLDialogElement>;

    private auth = inject(AuthService);
    private fb = inject(FormBuilder);
    private roadmapService = inject(RoadmapService);
    private apiUrl = environment.backendApiUrl;

    backendUser = this.auth.backendUser;
    fullProfile = signal<any | null>(null);

    isEditing = signal(false);
    isSaving = signal(false);
    saveMessage = signal('');
    showPasswordSection = signal(false);
    photoError = signal(false);

    private previousFocus: HTMLElement | null = null;
    private keydownHandler = (e: KeyboardEvent) => this.onKeydown(e);

    profileForm = this.fb.group({
        fullName: ['', [Validators.required]],
        phoneNumber: [''],
        phoneNumberEmergency: [''],
        medicalNotes: ['']
    });

    passwordForm = this.fb.group({
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]]
    });

    userName = computed(() =>
        this.fullProfile()?.fullName || this.backendUser()?.fullName || 'Player'
    );

    initials = computed(() => {
        const name = this.userName();
        if (!name) return 'P';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    });

    email = computed(() => this.backendUser()?.email ?? '');

    profilePhotoUrl = computed(() => {
        const path = this.fullProfile()?.profilePhotoPath;
        if (path) return `${this.apiUrl}${path}`;
        return null;
    });

    roleLabel = computed(() => {
        const r = this.backendUser()?.role ?? '';
        if (r.toUpperCase() === 'ADMIN') return 'ADMIN';
        return 'MEMBER';
    });

    accountStatusLabel = computed(() => {
        const s = this.backendUser()?.accountStatus;
        if (!s) return 'ACTIVE';
        return s;
    });

    accountStatusClass = computed(() => {
        const s = this.accountStatusLabel();
        if (s === 'ACTIVE') return 'badge-success';
        if (s === 'PENDING_VERIFICATION') return 'badge-warning';
        if (s === 'SUSPENDED' || s === 'BANNED') return 'badge-error';
        return 'badge-ghost';
    });

    private clampProgress(raw: number): number {
        if (!Number.isFinite(raw)) return 0;
        return Math.max(0, Math.min(100, Math.round(raw)));
    }

    private progressColor(pct: number): string {
        if (pct === 0) return 'progress-neutral';
        if (pct < 50) return 'progress-warning';
        if (pct < 100) return 'progress-info';
        return 'progress-success';
    }

    learningProgress = computed(() => this.clampProgress(this.computeProgress('learning')));
    developedProgress = computed(() => this.clampProgress(this.computeProgress('developed')));
    skilledProgress = computed(() => this.clampProgress(this.computeProgress('skilled')));

    learningColor = computed(() => this.progressColor(this.learningProgress()));
    developedColor = computed(() => this.progressColor(this.developedProgress()));
    skilledColor = computed(() => this.progressColor(this.skilledProgress()));

    totalSteps = computed(() => this.roadmapService.allSteps().length);

    lastUpdateFormatted = computed(() => {
        const dateStr = this.fullProfile()?.last_update_date;
        if (!dateStr) return '\u2014';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        } catch {
            return '\u2014';
        }
    });

    updatesUsed = computed(() => this.fullProfile()?.['updates_count'] ?? 0);

    private computeProgress(type: 'learning' | 'developed' | 'skilled'): number {
        const status = this.fullProfile()?.['status'];
        const steps = this.roadmapService.allSteps();
        if (!status || steps.length === 0) return 0;
        const pointer = status[type];
        if (!pointer) return 0;
        const idx = steps.findIndex(s => s.stepNumber === pointer);
        return idx >= 0 ? ((idx + 1) / steps.length) * 100 : 0;
    }

    ngOnInit() {
        this.loadProfile();
    }

    ngAfterViewInit() {
        if (this.dialogEl?.nativeElement) {
            this.dialogEl.nativeElement.addEventListener('cancel', (e) => {
                e.preventDefault();
                this.onClose();
            });
        }
    }

    ngOnDestroy() {
        document.removeEventListener('keydown', this.keydownHandler);
        document.body.style.overflow = '';
    }

    ngOnChanges() {
        if (this.isOpen) {
            this.openModal();
        } else {
            this.closeModal();
        }
    }

    private openModal() {
        this.previousFocus = document.activeElement as HTMLElement;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', this.keydownHandler);
        this.photoError.set(false);
        this.loadProfile();
    }

    private closeModal() {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', this.keydownHandler);
        if (this.previousFocus) {
            this.previousFocus.focus();
            this.previousFocus = null;
        }
        this.isEditing.set(false);
        this.showPasswordSection.set(false);
        this.saveMessage.set('');
    }

    private onKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape' && this.isOpen) {
            e.preventDefault();
            this.onClose();
        }
    }

    async loadProfile() {
        try {
            const profile = await this.auth.getProfile();
            this.fullProfile.set(profile);
        } catch {
            // fallback to backendUser data
        }
    }

    onPhotoError() {
        this.photoError.set(true);
    }

    startEditing() {
        const profile = this.fullProfile();
        this.profileForm.patchValue({
            fullName: profile?.fullName || this.backendUser()?.fullName || '',
            phoneNumber: profile?.phoneNumber || '',
            phoneNumberEmergency: profile?.phoneNumberEmergency || '',
            medicalNotes: profile?.medicalNotes || ''
        });
        this.isEditing.set(true);
        this.showPasswordSection.set(false);
        this.saveMessage.set('');
    }

    cancelEditing() {
        this.isEditing.set(false);
        this.profileForm.reset();
        this.saveMessage.set('');
    }

    async onSaveProfile() {
        if (this.profileForm.invalid || this.isSaving()) return;

        this.isSaving.set(true);
        this.saveMessage.set('');

        try {
            const data = this.profileForm.value;
            const updateData: Record<string, any> = {};
            if (data.fullName) updateData['fullName'] = data.fullName;
            if (data.phoneNumber) updateData['phoneNumber'] = data.phoneNumber;
            if (data.phoneNumberEmergency) updateData['phoneNumberEmergency'] = data.phoneNumberEmergency;
            if (data.medicalNotes) updateData['medicalNotes'] = data.medicalNotes;

            await this.auth.updateProfile(updateData);

            await this.loadProfile();
            this.saveMessage.set('Profile updated successfully');
            this.isEditing.set(false);
        } catch (err: any) {
            this.saveMessage.set(err.error?.message || 'Failed to update profile');
        } finally {
            this.isSaving.set(false);
        }
    }

    async onPhotoSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        const file = input.files[0];
        this.isSaving.set(true);

        try {
            await this.auth.updatePhoto(file);
            this.photoError.set(false);
            await this.loadProfile();
            this.saveMessage.set('Photo updated successfully');
        } catch (err: any) {
            this.saveMessage.set(err.error?.message || 'Failed to upload photo');
        } finally {
            this.isSaving.set(false);
            input.value = '';
        }
    }

    async onChangePassword() {
        if (this.passwordForm.invalid || this.isSaving()) return;

        this.isSaving.set(true);
        this.saveMessage.set('');

        try {
            await this.auth.changePassword(
                this.passwordForm.value.currentPassword!,
                this.passwordForm.value.newPassword!
            );
            this.saveMessage.set('Password changed successfully');
            this.passwordForm.reset();
            this.showPasswordSection.set(false);
        } catch (err: any) {
            this.saveMessage.set(err.error?.message || 'Failed to change password');
        } finally {
            this.isSaving.set(false);
        }
    }

    togglePasswordSection() {
        this.showPasswordSection.set(!this.showPasswordSection());
        if (this.showPasswordSection()) {
            this.isEditing.set(false);
            this.saveMessage.set('');
        }
    }

    onClose() {
        this.close.emit();
    }

    logout() {
        this.auth.logout();
    }
}
