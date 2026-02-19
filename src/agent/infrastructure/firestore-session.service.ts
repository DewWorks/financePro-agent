import { Injectable, Logger } from '@nestjs/common';
import { Firestore, FieldValue } from '@google-cloud/firestore';
import { BaseSessionService, Session, Event } from '@google/adk';

@Injectable()
export class FirestoreSessionService extends BaseSessionService {
    private readonly logger = new Logger(FirestoreSessionService.name);
    private firestore: Firestore;
    private collectionName = 'sessions';

    constructor() {
        super();
        this.firestore = new Firestore();
    }

    async createSession(session: Omit<Session, 'id'>): Promise<Session> {
        const docRef = this.firestore.collection(this.collectionName).doc();
        const newSession: Session = {
            ...session,
            id: docRef.id,
        };

        // Ensure all fields are valid for Firestore (no undefined)
        const sessionData = JSON.parse(JSON.stringify(newSession));
        await docRef.set(sessionData);
        this.logger.log(`Created new session: ${newSession.id}`);
        return newSession;
    }

    async getSession(request: { appName: string; userId: string; sessionId: string }): Promise<Session | undefined> {
        const { sessionId } = request;
        if (!sessionId) {
            this.logger.warn('getSession called without sessionId');
            return undefined;
        }

        const docRef = this.firestore.collection(this.collectionName).doc(sessionId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return undefined;
        }

        return doc.data() as Session;
    }

    async updateSession(session: Session): Promise<void> {
        if (!session.id) {
            throw new Error('Cannot update session without ID');
        }
        const docRef = this.firestore.collection(this.collectionName).doc(session.id);
        const sessionData = JSON.parse(JSON.stringify(session));
        await docRef.set(sessionData, { merge: true });
    }

    async listSessions(request: any): Promise<{ sessions: Session[] }> {
        // Basic implementation: for now return empty
        return { sessions: [] };
    }

    async deleteSession(request: { sessionId: string }): Promise<void> {
        await this.firestore.collection(this.collectionName).doc(request.sessionId).delete();
    }

    async appendEvent({ session, event }: { session: Session, event: Event }): Promise<Event> {
        if (!session.id) {
            throw new Error('Cannot append event to session without ID');
        }
        const docRef = this.firestore.collection(this.collectionName).doc(session.id);
        const eventData = JSON.parse(JSON.stringify(event));
        await docRef.update({
            events: FieldValue.arrayUnion(eventData)
        });
        return event;
    }
}
